// components/EventTour.tsx - Programme des événements et activités
import React, { useState, useRef, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Modal,
  Animated,
  Dimensions,
  FlatList,
  ScrollView,
} from 'react-native';

interface EventInfo {
  id: string;
  title: string;
  description: string;
  startTime: string;
  endTime: string;
  duration: string;
  location: string;
  distance: string;
  walkingTime: string;
  category: 'concert' | 'sport' | 'exhibition' | 'conference' | 'food' | 'entertainment';
  priority: 'high' | 'medium' | 'low';
  capacity?: number;
  currentAttendance?: number;
  price?: string;
  ageRestriction?: string;
  highlights: string[];
  tags: string[];
  isLive?: boolean;
  isUpcoming?: boolean;
  isSoldOut?: boolean;
}

interface EventTourProps {
  isVisible: boolean;
  onClose: () => void;
  onNavigateToEvent: (event: EventInfo) => void;
  mapLocations?: any[];
}

export default function EventTour({ 
  isVisible, 
  onClose, 
  onNavigateToEvent,
  mapLocations = []
}: EventTourProps) {
  const { height: screenHeight } = Dimensions.get('window');
  const [selectedFilter, setSelectedFilter] = useState<'all' | 'now' | 'upcoming' | 'priority'>('all');
  const [selectedCategory, setSelectedCategory] = useState<EventInfo['category'] | 'all'>('all');
  const slideAnim = useRef(new Animated.Value(screenHeight)).current;

  // Données d'événements simulées (en production, viendraient d'une API)
  const eventData = useMemo((): EventInfo[] => [
    {
      id: 'event-1',
      title: 'Concert Coldplay - Music of the Spheres',
      description: 'Concert exceptionnel du groupe britannique avec un show son et lumière spectaculaire.',
      startTime: '20:30',
      endTime: '23:00',
      duration: '2h30',
      location: 'Scène Principale',
      distance: '180m',
      walkingTime: '3 min',
      category: 'concert',
      priority: 'high',
      capacity: 50000,
      currentAttendance: 48500,
      price: '89€ - 150€',
      highlights: [
        'Première européenne de "Higher Power"',
        'Show pyrotechnique exceptionnel',
        'Bracelets LED synchronisés offerts'
      ],
      tags: ['Rock', 'Pop', 'Show spectacle'],
      isLive: true,
      isSoldOut: true
    },
    {
      id: 'event-2',
      title: 'Match de Football - PSG vs Barcelona',
      description: 'Rencontre de prestige entre deux géants européens dans un stade en effervescence.',
      startTime: '21:00',
      endTime: '23:00',
      duration: '2h00',
      location: 'Parc des Princes',
      distance: '220m',
      walkingTime: '4 min',
      category: 'sport',
      priority: 'high',
      capacity: 47929,
      currentAttendance: 47929,
      price: '45€ - 200€',
      highlights: [
        'Messi vs Neymar face à face',
        'Ambiance exceptionnelle garantie',
        'Diffusion sur écrans géants'
      ],
      tags: ['Football', 'Ligue des Champions', 'Prestige'],
      isLive: true,
      isSoldOut: true
    },
    {
      id: 'event-3',
      title: 'Exposition "Art Digital Immersif"',
      description: 'Découvrez l\'art contemporain dans un univers numérique à 360° unique en son genre.',
      startTime: '10:00',
      endTime: '22:00',
      duration: '12h (visite libre)',
      location: 'Pavillon Innovation',
      distance: '95m',
      walkingTime: '2 min',
      category: 'exhibition',
      priority: 'medium',
      capacity: 200,
      currentAttendance: 150,
      price: '15€ - 25€',
      highlights: [
        'Réalité virtuelle incluse',
        'Œuvres interactives uniques',
        'Espace photo Instagram'
      ],
      tags: ['Art numérique', 'VR', 'Innovation'],
      isUpcoming: false
    },
    {
      id: 'event-4',
      title: 'Conférence Tech "IA & Futur"',
      description: 'Rencontrez les experts mondiaux de l\'intelligence artificielle et découvrez les innovations de demain.',
      startTime: '14:00',
      endTime: '18:00',
      duration: '4h00',
      location: 'Auditorium Central',
      distance: '150m',
      walkingTime: '3 min',
      category: 'conference',
      priority: 'medium',
      capacity: 500,
      currentAttendance: 320,
      price: 'Gratuit',
      ageRestriction: '16+',
      highlights: [
        'Démonstrations en direct',
        'Networking avec les speakers',
        'Goodies tech exclusifs'
      ],
      tags: ['Technologie', 'IA', 'Innovation'],
      isUpcoming: true
    },
    {
      id: 'event-5',
      title: 'Festival Gastronomique "Saveurs du Monde"',
      description: 'Voyage culinaire à travers 25 pays avec des chefs étoilés et des spécialités authentiques.',
      startTime: '11:00',
      endTime: '00:00',
      duration: '13h (service continu)',
      location: 'Esplanade Food Court',
      distance: '75m',
      walkingTime: '1 min',
      category: 'food',
      priority: 'high',
      highlights: [
        'Dégustations gratuites toutes les heures',
        '15 chefs étoilés présents',
        'Atelier cuisine pour enfants'
      ],
      tags: ['Gastronomie', 'International', 'Famille'],
      isUpcoming: false
    },
    {
      id: 'event-6',
      title: 'Spectacle de Magie "Illusions Grandioses"',
      description: 'Show de magie moderne avec des illusions à grande échelle et effets spéciaux époustouflants.',
      startTime: '19:00',
      endTime: '20:30',
      duration: '1h30',
      location: 'Théâtre des Merveilles',
      distance: '200m',
      walkingTime: '4 min',
      category: 'entertainment',
      priority: 'medium',
      capacity: 800,
      currentAttendance: 650,
      price: '25€ - 45€',
      highlights: [
        'Participation du public',
        'Effets holographiques',
        'Rencontre avec le magicien après le show'
      ],
      tags: ['Magie', 'Spectacle', 'Famille'],
      isUpcoming: true
    }
  ], []);

  // Filtrer les événements
  const filteredEvents = useMemo(() => {
    let filtered = eventData;

    // Filtre par statut
    if (selectedFilter === 'now') {
      filtered = filtered.filter(event => event.isLive);
    } else if (selectedFilter === 'upcoming') {
      filtered = filtered.filter(event => event.isUpcoming);
    } else if (selectedFilter === 'priority') {
      filtered = filtered.filter(event => event.priority === 'high');
    }

    // Filtre par catégorie
    if (selectedCategory !== 'all') {
      filtered = filtered.filter(event => event.category === selectedCategory);
    }

    return filtered;
  }, [eventData, selectedFilter, selectedCategory]);

  React.useEffect(() => {
    if (isVisible) {
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
    });
  };

  const getCategoryIcon = (category: EventInfo['category']) => {
    switch (category) {
      case 'concert': return '🎵';
      case 'sport': return '⚽';
      case 'exhibition': return '🎨';
      case 'conference': return '🎤';
      case 'food': return '🍽️';
      case 'entertainment': return '🎭';
      default: return '📅';
    }
  };

  const getCategoryColor = (category: EventInfo['category']) => {
    switch (category) {
      case 'concert': return '#9C27B0';
      case 'sport': return '#4CAF50';
      case 'exhibition': return '#FF9800';
      case 'conference': return '#2196F3';
      case 'food': return '#FF5722';
      case 'entertainment': return '#E91E63';
      default: return '#666';
    }
  };

  const getPriorityColor = (priority: EventInfo['priority']) => {
    switch (priority) {
      case 'high': return '#FF5722';
      case 'medium': return '#FF9800';
      case 'low': return '#4CAF50';
      default: return '#666';
    }
  };

  const getStatusText = (event: EventInfo) => {
    if (event.isLive) return { text: 'EN COURS', color: '#FF5722' };
    if (event.isUpcoming) return { text: 'BIENTÔT', color: '#FF9800' };
    if (event.isSoldOut) return { text: 'COMPLET', color: '#666' };
    return { text: 'DISPONIBLE', color: '#4CAF50' };
  };

  const renderFilterButton = (filter: typeof selectedFilter, label: string, icon: string) => (
    <TouchableOpacity
      key={filter}
      style={[
        styles.filterButton,
        selectedFilter === filter && styles.filterButtonActive
      ]}
      onPress={() => setSelectedFilter(filter)}
    >
      <Text style={[
        styles.filterIcon,
        selectedFilter === filter && styles.filterIconActive
      ]}>
        {icon}
      </Text>
      <Text style={[
        styles.filterText,
        selectedFilter === filter && styles.filterTextActive
      ]}>
        {label}
      </Text>
    </TouchableOpacity>
  );

  const renderCategoryButton = (category: EventInfo['category'] | 'all', label: string, icon: string) => (
    <TouchableOpacity
      key={category}
      style={[
        styles.categoryButton,
        selectedCategory === category && styles.categoryButtonActive
      ]}
      onPress={() => setSelectedCategory(category)}
    >
      <Text style={styles.categoryIcon}>{icon}</Text>
      <Text style={[
        styles.categoryText,
        selectedCategory === category && styles.categoryTextActive
      ]}>
        {label}
      </Text>
    </TouchableOpacity>
  );

  const renderEventItem = ({ item }: { item: EventInfo }) => {
    const status = getStatusText(item);
    const categoryColor = getCategoryColor(item.category);
    
    return (
      <View style={styles.eventCard}>
        <View style={styles.eventHeader}>
          <View style={styles.eventTimeContainer}>
            <Text style={styles.eventTime}>{item.startTime}</Text>
            <Text style={styles.eventDuration}>{item.duration}</Text>
          </View>
          
          <View style={[styles.statusBadge, { backgroundColor: status.color }]}>
            <Text style={styles.statusText}>{status.text}</Text>
          </View>
        </View>

        <View style={styles.eventContent}>
          <View style={styles.eventTitleRow}>
            <Text style={[styles.categoryIcon, { color: categoryColor }]}>
              {getCategoryIcon(item.category)}
            </Text>
            <Text style={styles.eventTitle}>{item.title}</Text>
            {item.priority === 'high' && (
              <View style={styles.priorityBadge}>
                <Text style={styles.priorityText}>⭐ À NE PAS RATER</Text>
              </View>
            )}
          </View>

          <Text style={styles.eventDescription}>{item.description}</Text>

          <View style={styles.eventDetails}>
            <View style={styles.detailRow}>
              <Text style={styles.detailIcon}>📍</Text>
              <Text style={styles.detailText}>{item.location}</Text>
            </View>
            <View style={styles.detailRow}>
              <Text style={styles.detailIcon}>🚶</Text>
              <Text style={styles.detailText}>{item.distance} • {item.walkingTime}</Text>
            </View>
            {item.price && (
              <View style={styles.detailRow}>
                <Text style={styles.detailIcon}>💰</Text>
                <Text style={styles.detailText}>{item.price}</Text>
              </View>
            )}
            {item.ageRestriction && (
              <View style={styles.detailRow}>
                <Text style={styles.detailIcon}>🔞</Text>
                <Text style={styles.detailText}>{item.ageRestriction}</Text>
              </View>
            )}
          </View>

          {item.highlights && item.highlights.length > 0 && (
            <View style={styles.highlightsContainer}>
              <Text style={styles.highlightsTitle}>Points forts :</Text>
              {item.highlights.map((highlight, index) => (
                <Text key={index} style={styles.highlightItem}>• {highlight}</Text>
              ))}
            </View>
          )}

          <View style={styles.tagsContainer}>
            {item.tags.map((tag, index) => (
              <View key={index} style={styles.tag}>
                <Text style={styles.tagText}>{tag}</Text>
              </View>
            ))}
          </View>

          {item.capacity && (
            <View style={styles.capacityContainer}>
              <View style={styles.capacityBar}>
                <View 
                  style={[
                    styles.capacityFill, 
                    { 
                      width: `${((item.currentAttendance || 0) / item.capacity) * 100}%`,
                      backgroundColor: item.isSoldOut ? '#FF5722' : '#4CAF50'
                    }
                  ]} 
                />
              </View>
              <Text style={styles.capacityText}>
                {item.currentAttendance || 0} / {item.capacity} places
              </Text>
            </View>
          )}
        </View>

        <TouchableOpacity
          style={[styles.navigateButton, { backgroundColor: categoryColor }]}
          onPress={() => {
            onNavigateToEvent(item);
            handleClose();
          }}
        >
          <Text style={styles.navigateIcon}>🧭</Text>
          <Text style={styles.navigateText}>S'y rendre</Text>
        </TouchableOpacity>
      </View>
    );
  };

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
          
          <View style={styles.header}>
            <Text style={styles.title}>Programme du jour ({filteredEvents.length})</Text>
            <Text style={styles.subtitle}>Découvrez tous les événements disponibles</Text>
          </View>

          {/* Filtres par statut */}
          <ScrollView 
            horizontal 
            showsHorizontalScrollIndicator={false}
            style={styles.filtersContainer}
            contentContainerStyle={styles.filtersContent}
          >
            {renderFilterButton('all', 'Tous', '📅')}
            {renderFilterButton('now', 'En cours', '🔴')}
            {renderFilterButton('upcoming', 'Bientôt', '⏰')}
            {renderFilterButton('priority', 'Incontournables', '⭐')}
          </ScrollView>

          {/* Filtres par catégorie */}
          <ScrollView 
            horizontal 
            showsHorizontalScrollIndicator={false}
            style={styles.categoriesContainer}
            contentContainerStyle={styles.categoriesContent}
          >
            {renderCategoryButton('all', 'Toutes', '🎪')}
            {renderCategoryButton('concert', 'Concerts', '🎵')}
            {renderCategoryButton('sport', 'Sports', '⚽')}
            {renderCategoryButton('exhibition', 'Expos', '🎨')}
            {renderCategoryButton('food', 'Food', '🍽️')}
            {renderCategoryButton('entertainment', 'Shows', '🎭')}
          </ScrollView>

          <FlatList
            data={filteredEvents}
            renderItem={renderEventItem}
            keyExtractor={(item) => item.id}
            style={styles.eventsList}
            showsVerticalScrollIndicator={false}
            contentContainerStyle={styles.eventsContent}
            ItemSeparatorComponent={() => <View style={styles.separator} />}
            ListEmptyComponent={
              <View style={styles.emptyContainer}>
                <Text style={styles.emptyIcon}>🎪</Text>
                <Text style={styles.emptyText}>Aucun événement trouvé</Text>
                <Text style={styles.emptySubtext}>
                  Essayez de modifier vos filtres
                </Text>
              </View>
            }
          />

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
    height: '90%',
    maxHeight: 750,
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
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  
  title: {
    fontSize: 24,
    fontWeight: '700',
    color: '#1a1a1a',
  },
  
  subtitle: {
    fontSize: 14,
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
  
  filtersContainer: {
    maxHeight: 50,
    marginBottom: 8,
  },
  
  filtersContent: {
    paddingHorizontal: 24,
    gap: 12,
  },
  
  filterButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f8f9fa',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    gap: 6,
  },
  
  filterButtonActive: {
    backgroundColor: '#4285F4',
  },
  
  filterIcon: {
    fontSize: 14,
    color: '#666',
  },
  
  filterIconActive: {
    color: '#ffffff',
  },
  
  filterText: {
    fontSize: 13,
    fontWeight: '500',
    color: '#666',
  },
  
  filterTextActive: {
    color: '#ffffff',
  },
  
  categoriesContainer: {
    maxHeight: 50,
    marginBottom: 16,
  },
  
  categoriesContent: {
    paddingHorizontal: 24,
    gap: 8,
  },
  
  categoryButton: {
    alignItems: 'center',
    backgroundColor: '#f8f9fa',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 16,
    minWidth: 60,
  },
  
  categoryButtonActive: {
    backgroundColor: '#e3f2fd',
    borderWidth: 1,
    borderColor: '#2196F3',
  },
  
  categoryIcon: {
    fontSize: 16,
    marginBottom: 2,
  },
  
  categoryText: {
    fontSize: 11,
    color: '#666',
    fontWeight: '500',
  },
  
  categoryTextActive: {
    color: '#2196F3',
    fontWeight: '600',
  },
  
  eventsList: {
    flex: 1,
    paddingHorizontal: 24,
  },
  
  eventsContent: {
    paddingVertical: 8,
    paddingBottom: 20,
  },
  
  eventCard: {
    backgroundColor: '#f8f9fa',
    borderRadius: 16,
    padding: 20,
    marginVertical: 6,
    borderWidth: 1,
    borderColor: '#e9ecef',
  },
  
  eventHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 16,
  },
  
  eventTimeContainer: {
    alignItems: 'flex-start',
  },
  
  eventTime: {
    fontSize: 20,
    fontWeight: '700',
    color: '#1a1a1a',
  },
  
  eventDuration: {
    fontSize: 12,
    color: '#666',
    marginTop: 2,
  },
  
  statusBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
  },
  
  statusText: {
    color: '#ffffff',
    fontSize: 11,
    fontWeight: '700',
  },
  
  eventContent: {
    marginBottom: 16,
  },
  
  eventTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
    gap: 8,
  },
  
  eventTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1a1a1a',
    flex: 1,
  },
  
  priorityBadge: {
    backgroundColor: '#fff3e0',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#FF9800',
  },
  
  priorityText: {
    fontSize: 10,
    color: '#FF9800',
    fontWeight: '700',
  },
  
  eventDescription: {
    fontSize: 14,
    color: '#666',
    lineHeight: 20,
    marginBottom: 12,
  },
  
  eventDetails: {
    marginBottom: 12,
    gap: 6,
  },
  
  detailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  
  detailIcon: {
    fontSize: 14,
    width: 20,
  },
  
  detailText: {
    fontSize: 14,
    color: '#333',
    fontWeight: '500',
  },
  
  highlightsContainer: {
    backgroundColor: '#e8f5e8',
    padding: 12,
    borderRadius: 12,
    marginBottom: 12,
  },
  
  highlightsTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#2e7d32',
    marginBottom: 6,
  },
  
  highlightItem: {
    fontSize: 13,
    color: '#2e7d32',
    lineHeight: 18,
  },
  
  tagsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    marginBottom: 12,
  },
  
  tag: {
    backgroundColor: '#e3f2fd',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  
  tagText: {
    fontSize: 11,
    color: '#1976d2',
    fontWeight: '500',
  },
  
  capacityContainer: {
    marginBottom: 8,
  },
  
  capacityBar: {
    height: 6,
    backgroundColor: '#e9ecef',
    borderRadius: 3,
    overflow: 'hidden',
    marginBottom: 4,
  },
  
  capacityFill: {
    height: '100%',
    borderRadius: 3,
  },
  
  capacityText: {
    fontSize: 12,
    color: '#666',
    textAlign: 'right',
  },
  
  navigateButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    borderRadius: 12,
    gap: 8,
  },
  
  navigateIcon: {
    fontSize: 16,
    color: '#ffffff',
  },
  
  navigateText: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: '600',
  },
  
  separator: {
    height: 8,
  },
  
  emptyContainer: {
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