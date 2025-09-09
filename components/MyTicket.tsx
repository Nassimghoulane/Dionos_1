// components/MyTicket.tsx - Gestion des places nominatives
import React, { useState, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Modal,
  TextInput,
  Alert,
  Animated,
  Dimensions,
  ScrollView,
  Vibration,
} from 'react-native';

interface TicketInfo {
  id: string;
  eventName: string;
  venue: string;
  date: string;
  time: string;
  section: string;
  row: string;
  seat: string;
  gate?: string;
  price?: string;
  barcode?: string;
  qrCode?: string;
  createdAt: string;
}

interface MyTicketProps {
  isVisible: boolean;
  onClose: () => void;
  onTicketSaved: (ticket: TicketInfo) => void;
  savedTickets: TicketInfo[];
}

export default function MyTicket({ 
  isVisible, 
  onClose, 
  onTicketSaved, 
  savedTickets 
}: MyTicketProps) {
  const { height: screenHeight } = Dimensions.get('window');
  const [currentView, setCurrentView] = useState<'main' | 'scan' | 'manual' | 'tickets'>('main');
  const [scannedData, setScannedData] = useState<string>('');
  const [isScanning, setIsScanning] = useState(false);
  
  // États pour la saisie manuelle
  const [manualTicket, setManualTicket] = useState({
    eventName: '',
    venue: '',
    date: '',
    time: '',
    section: '',
    row: '',
    seat: '',
    gate: '',
    price: '',
  });

  const slideAnim = useRef(new Animated.Value(screenHeight)).current;

  React.useEffect(() => {
    if (isVisible) {
      setCurrentView('main');
      Animated.spring(slideAnim, {
        toValue: 0,
        useNativeDriver: false,
        tension: 100,
        friction: 8,
      }).start();
    } else {
      Animated.timing(slideAnim, {
        toValue: screenHeight,
        duration: 300,
        useNativeDriver: false,
      }).start();
    }
  }, [isVisible]);

  const handleClose = () => {
    Animated.timing(slideAnim, {
      toValue: screenHeight,
      duration: 300,
      useNativeDriver: false,
    }).start(() => {
      onClose();
      setCurrentView('main');
      resetForms();
    });
  };

  const resetForms = () => {
    setScannedData('');
    setManualTicket({
      eventName: '',
      venue: '',
      date: '',
      time: '',
      section: '',
      row: '',
      seat: '',
      gate: '',
      price: '',
    });
  };

  // Simulation du scanner de QR code/code-barres
  const simulateBarcodeScan = () => {
    setIsScanning(true);
    Vibration.vibrate(100);
    
    // Simulation d'un délai de scan
    setTimeout(() => {
      const mockBarcodeData = "EVT2024|Concert Coldplay|Stade de France|2024-09-15|20:30|Section A|Rang 12|Place 45|Porte 7|€89.50";
      setScannedData(mockBarcodeData);
      parseScannedData(mockBarcodeData);
      setIsScanning(false);
      Vibration.vibrate([50, 100, 50]);
    }, 2000);
  };

  const parseScannedData = (data: string) => {
    try {
      const parts = data.split('|');
      if (parts.length >= 9) {
        const parsed = {
          eventName: parts[1] || '',
          venue: parts[2] || '',
          date: parts[3] || '',
          time: parts[4] || '',
          section: parts[5] || '',
          row: parts[6] || '',
          seat: parts[7] || '',
          gate: parts[8] || '',
          price: parts[9] || '',
        };
        setManualTicket(parsed);
        setCurrentView('manual'); // Permet de vérifier/modifier avant sauvegarde
      } else {
        Alert.alert(
          'Format non reconnu',
          'Le code scanné ne correspond pas au format attendu. Veuillez saisir les informations manuellement.',
          [
            { text: 'OK', onPress: () => setCurrentView('manual') }
          ]
        );
      }
    } catch (error) {
      Alert.alert(
        'Erreur de scan',
        'Impossible de décoder le billet. Veuillez réessayer ou saisir manuellement.',
        [
          { text: 'Réessayer', onPress: () => setCurrentView('scan') },
          { text: 'Saisie manuelle', onPress: () => setCurrentView('manual') }
        ]
      );
    }
  };

  const handleSaveTicket = () => {
    // Validation des champs obligatoires
    if (!manualTicket.eventName || !manualTicket.section || !manualTicket.row || !manualTicket.seat) {
      Alert.alert(
        'Informations manquantes',
        'Veuillez remplir au minimum le nom de l\'événement, la section, le rang et le numéro de place.',
        [{ text: 'OK' }]
      );
      return;
    }

    const newTicket: TicketInfo = {
      id: Date.now().toString(),
      ...manualTicket,
      barcode: scannedData || undefined,
      createdAt: new Date().toISOString(),
    };

    onTicketSaved(newTicket);
    Vibration.vibrate([100, 50, 100]);
    
    Alert.alert(
      'Billet sauvegardé !',
      `Votre place ${manualTicket.section} ${manualTicket.row} ${manualTicket.seat} a été enregistrée.`,
      [
        { text: 'Voir mes billets', onPress: () => setCurrentView('tickets') },
        { text: 'Fermer', onPress: handleClose }
      ]
    );
    
    resetForms();
  };

  const handleDeleteTicket = (ticketId: string) => {
    Alert.alert(
      'Supprimer le billet',
      'Êtes-vous sûr de vouloir supprimer ce billet ?',
      [
        { text: 'Annuler', style: 'cancel' },
        { 
          text: 'Supprimer', 
          style: 'destructive',
          onPress: () => {
            // Cette fonction devrait être implémentée dans le parent
            console.log('Supprimer billet:', ticketId);
          }
        }
      ]
    );
  };

  const renderMainView = () => (
    <View style={styles.mainContainer}>
      <View style={styles.header}>
        <Text style={styles.title}>Ma Place</Text>
        <Text style={styles.subtitle}>Gérez vos places nominatives</Text>
      </View>

      <View style={styles.optionsContainer}>
        <TouchableOpacity
          style={styles.optionCard}
          onPress={() => setCurrentView('scan')}
          activeOpacity={0.7}
        >
          <View style={styles.optionIcon}>
            <Text style={styles.optionEmoji}>📱</Text>
          </View>
          <View style={styles.optionContent}>
            <Text style={styles.optionTitle}>Scanner mon billet</Text>
            <Text style={styles.optionDescription}>
              Scannez le QR code ou code-barres de votre billet
            </Text>
          </View>
          <Text style={styles.optionArrow}>›</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.optionCard}
          onPress={() => setCurrentView('manual')}
          activeOpacity={0.7}
        >
          <View style={styles.optionIcon}>
            <Text style={styles.optionEmoji}>✏️</Text>
          </View>
          <View style={styles.optionContent}>
            <Text style={styles.optionTitle}>Saisie manuelle</Text>
            <Text style={styles.optionDescription}>
              Entrez les informations de votre place
            </Text>
          </View>
          <Text style={styles.optionArrow}>›</Text>
        </TouchableOpacity>

        {savedTickets.length > 0 && (
          <TouchableOpacity
            style={styles.optionCard}
            onPress={() => setCurrentView('tickets')}
            activeOpacity={0.7}
          >
            <View style={styles.optionIcon}>
              <Text style={styles.optionEmoji}>🎫</Text>
            </View>
            <View style={styles.optionContent}>
              <Text style={styles.optionTitle}>Mes billets ({savedTickets.length})</Text>
              <Text style={styles.optionDescription}>
                Consultez vos places enregistrées
              </Text>
            </View>
            <Text style={styles.optionArrow}>›</Text>
          </TouchableOpacity>
        )}
      </View>
    </View>
  );

  const renderScanView = () => (
    <View style={styles.scanContainer}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => setCurrentView('main')} style={styles.backButton}>
          <Text style={styles.backText}>‹ Retour</Text>
        </TouchableOpacity>
        <Text style={styles.title}>Scanner le billet</Text>
      </View>

      <View style={styles.scanArea}>
        <View style={[styles.scanFrame, isScanning && styles.scanFrameActive]}>
          <Text style={styles.scanIcon}>{isScanning ? '⏳' : '📱'}</Text>
          <Text style={styles.scanText}>
            {isScanning ? 'Scan en cours...' : 'Positionnez le QR code dans le cadre'}
          </Text>
          
          {isScanning && (
            <View style={styles.scanProgressContainer}>
              <View style={styles.scanProgressBar}>
                <Animated.View style={styles.scanProgress} />
              </View>
            </View>
          )}
        </View>

        <TouchableOpacity
          style={[styles.scanButton, isScanning && styles.scanButtonDisabled]}
          onPress={simulateBarcodeScan}
          disabled={isScanning}
        >
          <Text style={styles.scanButtonText}>
            {isScanning ? 'Scanning...' : 'Démarrer le scan'}
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.manualButton}
          onPress={() => setCurrentView('manual')}
        >
          <Text style={styles.manualButtonText}>Saisie manuelle</Text>
        </TouchableOpacity>
      </View>
    </View>
  );

  const renderManualView = () => (
    <ScrollView style={styles.manualContainer} showsVerticalScrollIndicator={false}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => setCurrentView('main')} style={styles.backButton}>
          <Text style={styles.backText}>‹ Retour</Text>
        </TouchableOpacity>
        <Text style={styles.title}>Informations du billet</Text>
      </View>

      <View style={styles.formContainer}>
        <View style={styles.inputGroup}>
          <Text style={styles.inputLabel}>Nom de l'événement *</Text>
          <TextInput
            style={styles.textInput}
            value={manualTicket.eventName}
            onChangeText={(text) => setManualTicket(prev => ({ ...prev, eventName: text }))}
            placeholder="Ex: Concert Coldplay"
            placeholderTextColor="#999"
          />
        </View>

        <View style={styles.inputGroup}>
          <Text style={styles.inputLabel}>Lieu</Text>
          <TextInput
            style={styles.textInput}
            value={manualTicket.venue}
            onChangeText={(text) => setManualTicket(prev => ({ ...prev, venue: text }))}
            placeholder="Ex: Stade de France"
            placeholderTextColor="#999"
          />
        </View>

        <View style={styles.inputRow}>
          <View style={[styles.inputGroup, { flex: 1, marginRight: 8 }]}>
            <Text style={styles.inputLabel}>Date</Text>
            <TextInput
              style={styles.textInput}
              value={manualTicket.date}
              onChangeText={(text) => setManualTicket(prev => ({ ...prev, date: text }))}
              placeholder="JJ/MM/AAAA"
              placeholderTextColor="#999"
            />
          </View>
          <View style={[styles.inputGroup, { flex: 1, marginLeft: 8 }]}>
            <Text style={styles.inputLabel}>Heure</Text>
            <TextInput
              style={styles.textInput}
              value={manualTicket.time}
              onChangeText={(text) => setManualTicket(prev => ({ ...prev, time: text }))}
              placeholder="20:30"
              placeholderTextColor="#999"
            />
          </View>
        </View>

        <View style={styles.inputRow}>
          <View style={[styles.inputGroup, { flex: 1, marginRight: 8 }]}>
            <Text style={styles.inputLabel}>Section *</Text>
            <TextInput
              style={styles.textInput}
              value={manualTicket.section}
              onChangeText={(text) => setManualTicket(prev => ({ ...prev, section: text }))}
              placeholder="A, B, VIP..."
              placeholderTextColor="#999"
            />
          </View>
          <View style={[styles.inputGroup, { flex: 1, marginLeft: 8 }]}>
            <Text style={styles.inputLabel}>Rang *</Text>
            <TextInput
              style={styles.textInput}
              value={manualTicket.row}
              onChangeText={(text) => setManualTicket(prev => ({ ...prev, row: text }))}
              placeholder="12, AA..."
              placeholderTextColor="#999"
            />
          </View>
        </View>

        <View style={styles.inputRow}>
          <View style={[styles.inputGroup, { flex: 1, marginRight: 8 }]}>
            <Text style={styles.inputLabel}>Place *</Text>
            <TextInput
              style={styles.textInput}
              value={manualTicket.seat}
              onChangeText={(text) => setManualTicket(prev => ({ ...prev, seat: text }))}
              placeholder="45, 12A..."
              placeholderTextColor="#999"
            />
          </View>
          <View style={[styles.inputGroup, { flex: 1, marginLeft: 8 }]}>
            <Text style={styles.inputLabel}>Porte</Text>
            <TextInput
              style={styles.textInput}
              value={manualTicket.gate}
              onChangeText={(text) => setManualTicket(prev => ({ ...prev, gate: text }))}
              placeholder="7, H..."
              placeholderTextColor="#999"
            />
          </View>
        </View>

        <View style={styles.inputGroup}>
          <Text style={styles.inputLabel}>Prix</Text>
          <TextInput
            style={styles.textInput}
            value={manualTicket.price}
            onChangeText={(text) => setManualTicket(prev => ({ ...prev, price: text }))}
            placeholder="€89.50"
            placeholderTextColor="#999"
          />
        </View>

        <TouchableOpacity style={styles.saveButton} onPress={handleSaveTicket}>
          <Text style={styles.saveButtonText}>💾 Sauvegarder ma place</Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );

  const renderTicketsView = () => (
    <ScrollView style={styles.ticketsContainer} showsVerticalScrollIndicator={false}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => setCurrentView('main')} style={styles.backButton}>
          <Text style={styles.backText}>‹ Retour</Text>
        </TouchableOpacity>
        <Text style={styles.title}>Mes billets ({savedTickets.length})</Text>
      </View>

      <View style={styles.ticketsList}>
        {savedTickets.map((ticket) => (
          <View key={ticket.id} style={styles.ticketCard}>
            <View style={styles.ticketHeader}>
              <Text style={styles.ticketEventName}>{ticket.eventName}</Text>
              <TouchableOpacity
                style={styles.deleteButton}
                onPress={() => handleDeleteTicket(ticket.id)}
              >
                <Text style={styles.deleteText}>🗑️</Text>
              </TouchableOpacity>
            </View>
            
            {ticket.venue && (
              <Text style={styles.ticketVenue}>📍 {ticket.venue}</Text>
            )}
            
            {(ticket.date || ticket.time) && (
              <Text style={styles.ticketDateTime}>
                📅 {ticket.date} {ticket.time && `• ${ticket.time}`}
              </Text>
            )}
            
            <View style={styles.ticketSeatInfo}>
              <View style={styles.seatDetail}>
                <Text style={styles.seatLabel}>Section</Text>
                <Text style={styles.seatValue}>{ticket.section}</Text>
              </View>
              <View style={styles.seatDetail}>
                <Text style={styles.seatLabel}>Rang</Text>
                <Text style={styles.seatValue}>{ticket.row}</Text>
              </View>
              <View style={styles.seatDetail}>
                <Text style={styles.seatLabel}>Place</Text>
                <Text style={styles.seatValue}>{ticket.seat}</Text>
              </View>
              {ticket.gate && (
                <View style={styles.seatDetail}>
                  <Text style={styles.seatLabel}>Porte</Text>
                  <Text style={styles.seatValue}>{ticket.gate}</Text>
                </View>
              )}
            </View>
            
            {ticket.price && (
              <Text style={styles.ticketPrice}>💰 {ticket.price}</Text>
            )}
          </View>
        ))}
        
        {savedTickets.length === 0 && (
          <View style={styles.emptyState}>
            <Text style={styles.emptyIcon}>🎫</Text>
            <Text style={styles.emptyText}>Aucun billet enregistré</Text>
            <Text style={styles.emptySubtext}>
              Ajoutez vos places pour les retrouver facilement
            </Text>
          </View>
        )}
      </View>
    </ScrollView>
  );

  if (!isVisible) return null;

  return (
    <Modal
      transparent
      visible={isVisible}
      onRequestClose={handleClose}
      animationType="none"
    >
      <View style={styles.overlay}>
        <Animated.View
          style={[
            styles.container,
            {
              transform: [{ translateY: slideAnim }],
            },
          ]}
        >
          <View style={styles.handle} />
          
          {currentView === 'main' && renderMainView()}
          {currentView === 'scan' && renderScanView()}
          {currentView === 'manual' && renderManualView()}
          {currentView === 'tickets' && renderTicketsView()}
          
          <TouchableOpacity style={styles.closeButton} onPress={handleClose}>
            <Text style={styles.closeButtonText}>✕</Text>
          </TouchableOpacity>
        </Animated.View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  
  container: {
    backgroundColor: '#ffffff',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    height: '85%',
    maxHeight: 700,
    elevation: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -8 },
    shadowOpacity: 0.25,
    shadowRadius: 16,
  },
  
  handle: {
    width: 40,
    height: 4,
    backgroundColor: '#d1d5db',
    borderRadius: 2,
    alignSelf: 'center',
    marginTop: 12,
    marginBottom: 8,
  },
  
  header: {
    paddingHorizontal: 24,
    paddingTop: 16,
    paddingBottom: 20,
    flexDirection: 'row',
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  
  backButton: {
    marginRight: 16,
    padding: 8,
  },
  
  backText: {
    fontSize: 16,
    color: '#4285F4',
    fontWeight: '600',
  },
  
  title: {
    fontSize: 24,
    fontWeight: '700',
    color: '#1a1a1a',
    flex: 1,
  },
  
  subtitle: {
    fontSize: 16,
    color: '#666',
    marginTop: 4,
  },
  
  closeButton: {
    position: 'absolute',
    top: 20,
    right: 20,
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#f5f5f5',
    justifyContent: 'center',
    alignItems: 'center',
  },
  
  closeButtonText: {
    fontSize: 16,
    color: '#666',
    fontWeight: '500',
  },
  
  // Main View Styles
  mainContainer: {
    flex: 1,
    paddingTop: 20,
  },
  
  optionsContainer: {
    paddingHorizontal: 24,
    gap: 16,
  },
  
  optionCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f8f9fa',
    borderRadius: 16,
    padding: 20,
    borderWidth: 1,
    borderColor: '#e9ecef',
  },
  
  optionIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#ffffff',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  
  optionEmoji: {
    fontSize: 24,
  },
  
  optionContent: {
    flex: 1,
  },
  
  optionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1a1a1a',
    marginBottom: 4,
  },
  
  optionDescription: {
    fontSize: 14,
    color: '#666',
    lineHeight: 20,
  },
  
  optionArrow: {
    fontSize: 24,
    color: '#999',
    fontWeight: '300',
  },
  
  // Scan View Styles
  scanContainer: {
    flex: 1,
  },
  
  scanArea: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 40,
  },
  
  scanFrame: {
    width: 250,
    height: 250,
    borderRadius: 20,
    borderWidth: 3,
    borderColor: '#4285F4',
    borderStyle: 'dashed',
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f8f9fa',
    marginBottom: 40,
  },
  
  scanFrameActive: {
    borderColor: '#34a853',
    backgroundColor: '#e8f5e8',
  },
  
  scanIcon: {
    fontSize: 48,
    marginBottom: 16,
  },
  
  scanText: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    fontWeight: '500',
  },
  
  scanProgressContainer: {
    marginTop: 20,
    width: '80%',
  },
  
  scanProgressBar: {
    height: 4,
    backgroundColor: '#e9ecef',
    borderRadius: 2,
    overflow: 'hidden',
  },
  
  scanProgress: {
    height: '100%',
    backgroundColor: '#34a853',
    width: '70%',
  },
  
  scanButton: {
    backgroundColor: '#4285F4',
    paddingVertical: 16,
    paddingHorizontal: 32,
    borderRadius: 25,
    marginBottom: 16,
  },
  
  scanButtonDisabled: {
    backgroundColor: '#ccc',
  },
  
  scanButtonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '600',
  },
  
  manualButton: {
    paddingVertical: 12,
    paddingHorizontal: 24,
  },
  
  manualButtonText: {
    color: '#4285F4',
    fontSize: 16,
    fontWeight: '500',
  },
  
  // Manual View Styles
  manualContainer: {
    flex: 1,
  },
  
  formContainer: {
    paddingHorizontal: 24,
    paddingTop: 20,
    paddingBottom: 40,
  },
  
  inputGroup: {
    marginBottom: 20,
  },
  
  inputRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
  },
  
  inputLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
    marginBottom: 8,
  },
  
  textInput: {
    borderWidth: 1,
    borderColor: '#e1e5e9',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontSize: 16,
    color: '#333',
    backgroundColor: '#fafafa',
  },
  
  saveButton: {
    backgroundColor: '#34a853',
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
    marginTop: 20,
  },
  
  saveButtonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '600',
  },
  
  // Tickets View Styles
  ticketsContainer: {
    flex: 1,
  },
  
  ticketsList: {
    paddingHorizontal: 24,
    paddingTop: 20,
  },
  
  ticketCard: {
    backgroundColor: '#f8f9fa',
    borderRadius: 16,
    padding: 20,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#e9ecef',
  },
  
  ticketHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  
  ticketEventName: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1a1a1a',
    flex: 1,
  },
  
  deleteButton: {
    padding: 4,
  },
  
  deleteText: {
    fontSize: 16,
  },
  
  ticketVenue: {
    fontSize: 14,
    color: '#666',
    marginBottom: 8,
  },
  
  ticketDateTime: {
    fontSize: 14,
    color: '#666',
    marginBottom: 16,
  },
  
  ticketSeatInfo: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    marginBottom: 12,
  },
  
  seatDetail: {
    backgroundColor: '#ffffff',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    alignItems: 'center',
    minWidth: 60,
  },
  
  seatLabel: {
    fontSize: 12,
    color: '#666',
    fontWeight: '500',
  },
  
  seatValue: {
    fontSize: 16,
    color: '#1a1a1a',
    fontWeight: '700',
    marginTop: 2,
  },
  
  ticketPrice: {
    fontSize: 14,
    color: '#34a853',
    fontWeight: '600',
  },
  
  emptyState: {
    alignItems: 'center',
    paddingVertical: 60,
  },
  
  emptyIcon: {
    fontSize: 48,
    marginBottom: 16,
  },
  
  emptyText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#666',
    marginBottom: 8,
  },
  
  emptySubtext: {
    fontSize: 14,
    color: '#999',
    textAlign: 'center',
  },
});