// components/AccountTab.tsx - Onglet Mon Compte (CORRIGÉ)
import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Modal,
  SafeAreaView,
  Alert,
} from 'react-native';
import { useClickCollect } from '../context/ClickCollectContext';

interface AccountTabProps {
  onNavigateToOrders: () => void;
  onNavigateToFavorites: () => void;
}

interface UserProfile {
  name: string;
  email: string;
  phone: string;
  festivalInfo: {
    year: string;
    type: string;
  };
}

export default function AccountTab({ 
  onNavigateToOrders, 
  onNavigateToFavorites 
}: AccountTabProps) {
  const { state } = useClickCollect();
  const [showProfile, setShowProfile] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  
  // Données utilisateur fictives
  const [userProfile] = useState<UserProfile>({
    name: 'Thibault Dubois',
    email: 'thibault.dubois@example.com',
    phone: '+33 6 12 34 56 78',
    festivalInfo: {
      year: '2024',
      type: 'VIP'
    }
  });

  const getOrderStats = () => {
    const activeOrders = state.activeOrders.filter(order => 
      !['collected', 'cancelled'].includes(order.status)
    );
    const completedOrders = state.activeOrders.filter(order => 
      order.status === 'collected'
    );
    return { 
      active: activeOrders.length, 
      completed: completedOrders.length,
      total: state.activeOrders.length 
    };
  };

  const orderStats = getOrderStats();

  const handleLogout = () => {
    Alert.alert(
      'Déconnexion',
      'Êtes-vous sûr de vouloir vous déconnecter ?',
      [
        { text: 'Annuler', style: 'cancel' },
        { 
          text: 'Déconnexion', 
          style: 'destructive',
          onPress: () => {
            // Logique de déconnexion ici
            Alert.alert('Déconnecté', 'Vous avez été déconnecté avec succès');
          }
        },
      ]
    );
  };

  const renderMenuSection = (
    title: string,
    subtitle: string,
    icon: string,
    onPress?: () => void,
    badge?: number
  ) => {
    const showBadge = badge !== undefined && badge > 0;
    
    return (
      <TouchableOpacity
        style={styles.menuItem}
        onPress={onPress}
        activeOpacity={0.7}
      >
        <View style={styles.menuItemLeft}>
          <View style={styles.menuIconContainer}>
            <Text style={styles.menuIcon}>{icon}</Text>
          </View>
          <View style={styles.menuTextContainer}>
            <Text style={styles.menuTitle}>{title}</Text>
            <Text style={styles.menuSubtitle}>{subtitle}</Text>
          </View>
        </View>
        <View style={styles.menuItemRight}>
          {showBadge && (
            <View style={styles.menuBadge}>
              <Text style={styles.menuBadgeText}>{badge}</Text>
            </View>
          )}
          <Text style={styles.menuArrow}>→</Text>
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <View style={styles.container}>
      {/* Header avec profil */}
      <View style={styles.header}>
        <View style={styles.headerContent}>
          <Text style={styles.headerTitle}>Mon Compte</Text>
          
          <TouchableOpacity
            style={styles.profileSection}
            onPress={() => setShowProfile(true)}
          >
            <View style={styles.avatarContainer}>
              <Text style={styles.avatarText}>
                {userProfile.name.split(' ').map(n => n[0]).join('')}
              </Text>
            </View>
            <View style={styles.profileInfo}>
              <Text style={styles.profileName}>{userProfile.name}</Text>
              <View style={styles.profileBadge}>
                <Text style={styles.profileBadgeText}>
                  🎪 Festival {userProfile.festivalInfo.year} • {userProfile.festivalInfo.type}
                </Text>
              </View>
            </View>
          </TouchableOpacity>
        </View>
      </View>

      {/* Menu principal */}
      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.menuSection}>
          {renderMenuSection(
            'Mes commandes',
            'Historique et suivi',
            '📦',
            onNavigateToOrders,
            orderStats.total
          )}
          
          {renderMenuSection(
            'Mes favoris',
            'Lieux et articles sauvegardés',
            '❤️',
            onNavigateToFavorites
          )}
          
          {renderMenuSection(
            'Mes trajets',
            'Vos récents itinéraires',
            '🧭',
            () => Alert.alert('Info', 'Fonctionnalité bientôt disponible')
          )}
          
          {renderMenuSection(
            'Paramètres',
            'Notifications et préférences',
            '⚙️',
            () => setShowSettings(true)
          )}
        </View>

        {/* Section aide et support */}
        <View style={styles.menuSection}>
          <Text style={styles.sectionTitle}>Aide & Support</Text>
          
          {renderMenuSection(
            'Centre d\'aide',
            'FAQ et guides d\'utilisation',
            '❓'
          )}
          
          {renderMenuSection(
            'Nous contacter',
            'Support client et assistance',
            '💬'
          )}
          
          {renderMenuSection(
            'À propos',
            'Version de l\'app et informations',
            'ℹ️'
          )}
        </View>

        {/* Bouton de déconnexion */}
        <TouchableOpacity
          style={styles.logoutButton}
          onPress={handleLogout}
        >
          <Text style={styles.logoutIcon}>🚪</Text>
          <Text style={styles.logoutText}>Déconnexion</Text>
        </TouchableOpacity>

        {/* Espace pour la navigation */}
        <View style={{ height: 100 }} />
      </ScrollView>

      {/* Modal Profil */}
      <Modal
        visible={showProfile}
        animationType="slide"
        presentationStyle="pageSheet"
      >
        <SafeAreaView style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Mon Profil</Text>
            <TouchableOpacity
              style={styles.closeButton}
              onPress={() => setShowProfile(false)}
            >
              <Text style={styles.closeButtonText}>✕</Text>
            </TouchableOpacity>
          </View>
          
          <ScrollView style={styles.modalContent}>
            <View style={styles.profileDetails}>
              <View style={styles.avatarLarge}>
                <Text style={styles.avatarLargeText}>
                  {userProfile.name.split(' ').map(n => n[0]).join('')}
                </Text>
              </View>
              
              <View style={styles.profileField}>
                <Text style={styles.fieldLabel}>Nom complet</Text>
                <Text style={styles.fieldValue}>{userProfile.name}</Text>
              </View>
              
              <View style={styles.profileField}>
                <Text style={styles.fieldLabel}>Email</Text>
                <Text style={styles.fieldValue}>{userProfile.email}</Text>
              </View>
              
              <View style={styles.profileField}>
                <Text style={styles.fieldLabel}>Téléphone</Text>
                <Text style={styles.fieldValue}>{userProfile.phone}</Text>
              </View>
              
              <View style={styles.profileField}>
                <Text style={styles.fieldLabel}>Festival</Text>
                <Text style={styles.fieldValue}>
                  Festival {userProfile.festivalInfo.year} - Accès {userProfile.festivalInfo.type}
                </Text>
              </View>
            </View>
            
            <TouchableOpacity style={styles.editButton}>
              <Text style={styles.editButtonText}>Modifier mes informations</Text>
            </TouchableOpacity>
          </ScrollView>
        </SafeAreaView>
      </Modal>

      {/* Modal Paramètres */}
      <Modal
        visible={showSettings}
        animationType="slide"
        presentationStyle="pageSheet"
      >
        <SafeAreaView style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Paramètres</Text>
            <TouchableOpacity
              style={styles.closeButton}
              onPress={() => setShowSettings(false)}
            >
              <Text style={styles.closeButtonText}>✕</Text>
            </TouchableOpacity>
          </View>
          
          <ScrollView style={styles.modalContent}>
            <View style={styles.settingsSection}>
              <Text style={styles.settingsSectionTitle}>Notifications</Text>
              
              <View style={styles.settingItem}>
                <Text style={styles.settingLabel}>Commandes Click & Collect</Text>
                <View style={styles.switchPlaceholder}>
                  <Text style={styles.switchText}>ON</Text>
                </View>
              </View>
              
              <View style={styles.settingItem}>
                <Text style={styles.settingLabel}>Navigation et trajets</Text>
                <View style={styles.switchPlaceholder}>
                  <Text style={styles.switchText}>ON</Text>
                </View>
              </View>
              
              <View style={styles.settingItem}>
                <Text style={styles.settingLabel}>Promotions et événements</Text>
                <View style={styles.switchPlaceholder}>
                  <Text style={styles.switchText}>OFF</Text>
                </View>
              </View>
            </View>
            
            <View style={styles.settingsSection}>
              <Text style={styles.settingsSectionTitle}>Préférences</Text>
              
              <TouchableOpacity style={styles.settingItem}>
                <Text style={styles.settingLabel}>Langue</Text>
                <Text style={styles.settingValue}>Français</Text>
              </TouchableOpacity>
              
              <TouchableOpacity style={styles.settingItem}>
                <Text style={styles.settingLabel}>Unité de distance</Text>
                <Text style={styles.settingValue}>Mètres</Text>
              </TouchableOpacity>
            </View>
          </ScrollView>
        </SafeAreaView>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f9fa',
  },
  
  header: {
    backgroundColor: '#ffffff',
    paddingTop: 60,
    paddingBottom: 24,
    paddingHorizontal: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  
  headerContent: {
    gap: 20,
  },
  
  headerTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#1a1a1a',
  },
  
  profileSection: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  
  avatarContainer: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#4285f4',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  
  avatarText: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#ffffff',
  },
  
  profileInfo: {
    flex: 1,
  },
  
  profileName: {
    fontSize: 20,
    fontWeight: '600',
    color: '#1a1a1a',
    marginBottom: 4,
  },
  
  profileBadge: {
    alignSelf: 'flex-start',
    backgroundColor: '#e3f2fd',
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
  },
  
  profileBadgeText: {
    fontSize: 12,
    color: '#1976d2',
    fontWeight: '500',
  },
  
  content: {
    flex: 1,
  },
  
  menuSection: {
    backgroundColor: '#ffffff',
    marginVertical: 8,
    paddingVertical: 8,
  },
  
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#6b7280',
    paddingHorizontal: 20,
    paddingVertical: 12,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#f1f3f4',
  },
  
  menuItemLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  
  menuIconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#f8f9fa',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  
  menuIcon: {
    fontSize: 18,
  },
  
  menuTextContainer: {
    flex: 1,
  },
  
  menuTitle: {
    fontSize: 16,
    fontWeight: '500',
    color: '#1a1a1a',
    marginBottom: 2,
  },
  
  menuSubtitle: {
    fontSize: 14,
    color: '#6b7280',
  },
  
  menuItemRight: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  
  menuBadge: {
    backgroundColor: '#ef4444',
    borderRadius: 10,
    minWidth: 20,
    height: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 8,
  },
  
  menuBadgeText: {
    fontSize: 10,
    fontWeight: 'bold',
    color: '#ffffff',
  },
  
  menuArrow: {
    fontSize: 16,
    color: '#9ca3af',
  },
  
  logoutButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#ffffff',
    marginHorizontal: 20,
    marginVertical: 20,
    paddingVertical: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#ef4444',
  },
  
  logoutIcon: {
    fontSize: 18,
    marginRight: 8,
  },
  
  logoutText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#ef4444',
  },
  
  // Modal styles
  modalContainer: {
    flex: 1,
    backgroundColor: '#ffffff',
  },
  
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
    backgroundColor: '#f8f9fa',
  },
  
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1a1a1a',
  },
  
  closeButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#ffffff',
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 2,
  },
  
  closeButtonText: {
    fontSize: 18,
    color: '#666',
    fontWeight: 'bold',
  },
  
  modalContent: {
    flex: 1,
    padding: 20,
  },
  
  profileDetails: {
    alignItems: 'center',
    marginBottom: 32,
  },
  
  avatarLarge: {
    width: 96,
    height: 96,
    borderRadius: 48,
    backgroundColor: '#4285f4',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 24,
  },
  
  avatarLargeText: {
    fontSize: 36,
    fontWeight: 'bold',
    color: '#ffffff',
  },
  
  profileField: {
    alignSelf: 'stretch',
    marginBottom: 16,
  },
  
  fieldLabel: {
    fontSize: 14,
    fontWeight: '500',
    color: '#6b7280',
    marginBottom: 4,
  },
  
  fieldValue: {
    fontSize: 16,
    color: '#1a1a1a',
    paddingVertical: 12,
    paddingHorizontal: 16,
    backgroundColor: '#f8f9fa',
    borderRadius: 8,
  },
  
  editButton: {
    backgroundColor: '#4285f4',
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  
  editButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#ffffff',
  },
  
  // Settings styles
  settingsSection: {
    marginBottom: 32,
  },
  
  settingsSectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1a1a1a',
    marginBottom: 16,
  },
  
  settingItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#f1f3f4',
  },
  
  settingLabel: {
    fontSize: 16,
    color: '#1a1a1a',
    flex: 1,
  },
  
  settingValue: {
    fontSize: 16,
    color: '#6b7280',
  },
  
  switchPlaceholder: {
    backgroundColor: '#4285f4',
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
  },
  
  switchText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#ffffff',
  },
});