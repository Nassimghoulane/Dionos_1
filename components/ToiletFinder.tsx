// components/ToiletFinder.tsx - Localisation des toilettes par genre
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

interface ToiletLocation {
  id: string;
  name: string;
  type: 'men' | 'women' | 'unisex' | 'accessible';
  level: string;
  distance?: string;
  walkingTime?: string;
  isClean?: boolean;
  hasAccessibility?: boolean;
  hasChangingTable?: boolean;
  crowdLevel?: 'Faible' | 'Modéré' | 'Élevé';
  description?: string;
  location: {
    x: number;
    y: number;
  };
}

interface ToiletFinderProps {
  isVisible: boolean;
  onClose: () => void;
  onNavigateToToilet: (toilet: ToiletLocation) => void;
  mapLocations?: any[];
}

export default function ToiletFinder({ 
  isVisible, 
  onClose, 
  onNavigateToToilet,
  mapLocations = []
}: ToiletFinderProps) {
  const { height: screenHeight } = Dimensions.get('window');
  const [selectedFilter, setSelectedFilter] = useState<'all' | 'men' | 'women' | 'accessible'>('all');
  const slideAnim = useRef(new Animated.Value(screenHeight)).current;

  // Générer des toilettes à partir des locations de la carte
  const toiletLocations = useMemo(() => {
    const toilets: ToiletLocation[] = [];
    
    // Chercher dans les locations de la carte les toilettes
    mapLocations.forEach((location, index) => {
      const lowerName = location.name.toLowerCase();
      if (lowerName.includes('washroom') || lowerName.includes('toilet') || lowerName.includes('restroom')) {
        // Générer toilettes hommes et femmes pour chaque location trouvée
        toilets.push({
          id: `${location.id}-men`,
          name: `${location.name} - Hommes`,
          type: 'men',
          level: 'Niveau 0',
          distance: `${50 + Math.floor(Math.random() * 150)}m`,
          walkingTime: `${1 + Math.floor(Math.random() * 3)} min`,
          isClean: Math.random() > 0.3,
          hasAccessibility: Math.random() > 0.4,
          hasChangingTable: Math.random() > 0.7,
          crowdLevel: ['Faible', 'Modéré', 'Élevé'][Math.floor(Math.random() * 3)] as 'Faible' | 'Modéré' | 'Élevé',
          description: 'Toilettes hommes avec lavabos automatiques',
          location: { x: location.x || 0, y: location.y || 0 }
        });

        toilets.push({
          id: `${location.id}-women`,
          name: `${location.name} - Femmes`,
          type: 'women',
          level: 'Niveau 0',
          distance: `${50 + Math.floor(Math.random() * 150)}m`,
          walkingTime: `${1 + Math.floor(Math.random() * 3)} min`,
          isClean: Math.random() > 0.3,
          hasAccessibility: Math.random() > 0.4,
          hasChangingTable: Math.random() > 0.5,
          crowdLevel: ['Faible', 'Modéré', 'Élevé'][Math.floor(Math.random() * 3)] as 'Faible' | 'Modéré' | 'Élevé',
          description: 'Toilettes femmes avec espace table à langer',
          location: { x: location.x || 0, y: location.y || 0 }
        });

        // Ajouter toilettes accessibles si disponible
        if (Math.random() > 0.6) {
          toilets.push({
            id: `${location.id}-accessible`,
            name: `${location.name} - PMR`,
            type: 'accessible',
            level: 'Niveau 0',
            distance: `${50 + Math.floor(Math.random() * 150)}m`,
            walkingTime: `${1 + Math.floor(Math.random() * 3)} min`,
            isClean: Math.random() > 0.2,
            hasAccessibility: true,
            hasChangingTable: true,
            crowdLevel: 'Faible' as 'Faible',
            description: 'Toilettes accessibles PMR avec équipements adaptés',
            location: { x: location.x || 0, y: location.y || 0 }
          });
        }
      }
    });

    // Si aucune toilette trouvée dans les locations, générer des exemples
    if (toilets.length === 0) {
      const defaultToilets: ToiletLocation[] = [
        {
          id: 'toilet-1-men',
          name: 'Toilettes Entrée Principale - Hommes',
          type: 'men',
          level: 'Niveau 0',
          distance: '120m',
          walkingTime: '2 min',
          isClean: true,
          hasAccessibility: false,
          hasChangingTable: false,
          crowdLevel: 'Modéré',
          description: 'Toilettes hommes près de l\'entrée principale',
          location: { x: 0, y: 0 }
        },
        {
          id: 'toilet-1-women',
          name: 'Toilettes Entrée Principale - Femmes',
          type: 'women',
          level: 'Niveau 0',
          distance: '125m',
          walkingTime: '2 min',
          isClean: true,
          hasAccessibility: false,
          hasChangingTable: true,
          crowdLevel: 'Modéré',
          description: 'Toilettes femmes avec table à langer',
          location: { x: 0, y: 0 }
        },
        {
          id: 'toilet-2-accessible',
          name: 'Toilettes Centre - PMR',
          type: 'accessible',
          level: 'Niveau 0',
          distance: '80m',
          walkingTime: '1 min',
          isClean: true,
          hasAccessibility: true,
          hasChangingTable: true,
          crowdLevel: 'Faible',
          description: 'Toilettes accessibles avec équipements PMR complets',
          location: { x: 0, y: 0 }
        }
      ];
      return defaultToilets;
    }

    return toilets;
  }, [mapLocations]);

  // Filtrer les toilettes selon le filtre sélectionné
  const filteredToilets = useMemo(() => {
    if (selectedFilter === 'all') return toiletLocations;
    return toiletLocations.filter(toilet => toilet.type === selectedFilter);
  }, [toiletLocations, selectedFilter]);

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

  const getToiletIcon = (type: ToiletLocation['type']) => {
    switch (type) {
      case 'men': return '🚹';
      case 'women': return '🚺';
      case 'accessible': return '♿';
      case 'unisex': return '🚻';
      default: return '🚻';
    }
  };

  const getToiletColor = (type: ToiletLocation['type']) => {
    switch (type) {
      case 'men': return '#4285F4';
      case 'women': return '#EA4335';
      case 'accessible': return '#34A853';
      case 'unisex': return '#9C27B0';
      default: return '#666';
    }
  };

  const getCrowdLevelColor = (level: string) => {
    switch (level) {
      case 'Faible': return '#22c55e';
      case 'Modéré': return '#f59e0b';
      case 'Élevé': return '#ef4444';
      default: return '#6b7280';
    }
  };

  const renderFilter = (filter: typeof selectedFilter, label: string, icon: string) => (
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

  const renderToiletItem = ({ item }: { item: ToiletLocation }) => (
    <View style={styles.toiletCard}>
      <View style={styles.toiletHeader}>
        <View style={styles.toiletIconContainer}>
          <Text style={[styles.toiletIcon, { color: getToiletColor(item.type) }]}>
            {getToiletIcon(item.type)}
          </Text>
        </View>
        <View style={styles.toiletInfo}>
          <Text style={styles.toiletName}>{item.name}</Text>
          <Text style={styles.toiletLevel}>{item.level}</Text>
        </View>
        <TouchableOpacity
          style={[styles.navigateButton, { backgroundColor: getToiletColor(item.type) }]}
          onPress={() => {
            onNavigateToToilet(item);
            handleClose();
          }}
        >
          <Text style={styles.navigateText}>Y aller</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.toiletDetails}>
        <View style={styles.detailRow}>
          <View style={styles.detailItem}>
            <Text style={styles.detailLabel}>Distance</Text>
            <Text style={styles.detailValue}>{item.distance}</Text>
          </View>
          <View style={styles.detailItem}>
            <Text style={styles.detailLabel}>Temps</Text>
            <Text style={styles.detailValue}>{item.walkingTime}</Text>
          </View>
          <View style={styles.detailItem}>
            <Text style={styles.detailLabel}>Affluence</Text>
            <Text style={[styles.detailValue, { color: getCrowdLevelColor(item.crowdLevel || '') }]}>
              {item.crowdLevel}
            </Text>
          </View>
        </View>

        <View style={styles.amenitiesRow}>
          {item.isClean && (
            <View style={styles.amenityTag}>
              <Text style={styles.amenityText}>✨ Propre</Text>
            </View>
          )}
          {item.hasAccessibility && (
            <View style={styles.amenityTag}>
              <Text style={styles.amenityText}>♿ PMR</Text>
            </View>
          )}
          {item.hasChangingTable && (
            <View style={styles.amenityTag}>
              <Text style={styles.amenityText}>👶 Table à langer</Text>
            </View>
          )}
        </View>

        {item.description && (
          <Text style={styles.toiletDescription}>{item.description}</Text>
        )}
      </View>
    </View>
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
          
          <View style={styles.header}>
            <Text style={styles.title}>Toilettes ({filteredToilets.length})</Text>
            <Text style={styles.subtitle}>Trouvez les toilettes les plus proches</Text>
          </View>

          <ScrollView 
            horizontal 
            showsHorizontalScrollIndicator={false}
            style={styles.filtersContainer}
            contentContainerStyle={styles.filtersContent}
          >
            {renderFilter('all', 'Toutes', '🚻')}
            {renderFilter('men', 'Hommes', '🚹')}
            {renderFilter('women', 'Femmes', '🚺')}
            {renderFilter('accessible', 'PMR', '♿')}
          </ScrollView>

          <FlatList
            data={filteredToilets}
            renderItem={renderToiletItem}
            keyExtractor={(item) => item.id}
            style={styles.toiletsList}
            showsVerticalScrollIndicator={false}
            contentContainerStyle={styles.toiletsContent}
            ItemSeparatorComponent={() => <View style={styles.separator} />}
            ListEmptyComponent={
              <View style={styles.emptyContainer}>
                <Text style={styles.emptyIcon}>🚽</Text>
                <Text style={styles.emptyText}>Aucune toilette trouvée</Text>
                <Text style={styles.emptySubtext}>
                  Essayez un autre filtre ou vérifiez votre position
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
    height: '80%',
    maxHeight: 650,
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
    maxHeight: 60,
    marginBottom: 16,
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
    paddingVertical: 10,
    borderRadius: 20,
    gap: 6,
  },
  
  filterButtonActive: {
    backgroundColor: '#4a5568',
  },
  
  filterIcon: {
    fontSize: 16,
    color: '#666',
  },
  
  filterIconActive: {
    color: '#ffffff',
  },
  
  filterText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#666',
  },
  
  filterTextActive: {
    color: '#ffffff',
  },
  
  toiletsList: {
    flex: 1,
    paddingHorizontal: 24,
  },
  
  toiletsContent: {
    paddingVertical: 8,
    paddingBottom: 20,
  },
  
  toiletCard: {
    backgroundColor: '#f8f9fa',
    borderRadius: 16,
    padding: 20,
    marginVertical: 4,
    borderWidth: 1,
    borderColor: '#e9ecef',
  },
  
  toiletHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  
  toiletIconContainer: {
    width: 48,
    height: 48,
    borderRadius: 12,
    backgroundColor: '#ffffff',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  
  toiletIcon: {
    fontSize: 24,
  },
  
  toiletInfo: {
    flex: 1,
  },
  
  toiletName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1a1a1a',
    marginBottom: 4,
  },
  
  toiletLevel: {
    fontSize: 14,
    color: '#666',
  },
  
  navigateButton: {
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 20,
  },
  
  navigateText: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: '600',
  },
  
  toiletDetails: {
    gap: 12,
  },
  
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  
  detailItem: {
    alignItems: 'center',
    flex: 1,
  },
  
  detailLabel: {
    fontSize: 12,
    color: '#666',
    fontWeight: '500',
    marginBottom: 4,
  },
  
  detailValue: {
    fontSize: 14,
    color: '#1a1a1a',
    fontWeight: '600',
  },
  
  amenitiesRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  
  amenityTag: {
    backgroundColor: '#e8f5e8',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#34a853',
  },
  
  amenityText: {
    fontSize: 12,
    color: '#34a853',
    fontWeight: '500',
  },
  
  toiletDescription: {
    fontSize: 14,
    color: '#666',
    lineHeight: 20,
    fontStyle: 'italic',
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