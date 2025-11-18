import { GarizetuLogo } from '@/components/garizetu-logo';
import { router } from 'expo-router';
import React, { useState } from 'react';
import { ImageBackground, Pressable, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

const onboardingData = [
  {
    id: 1,
    title: 'Welcome to gariZetu',
    subtitle: '',
    description: '',
    image: 'https://images.unsplash.com/photo-1492144534655-ae79c964c9d7?w=800',
  },
  {
    id: 2,
    title: "Let's Start",
    subtitle: 'A New Experience',
    description: 'With Car rental.',
    image: 'https://images.unsplash.com/photo-1503376780353-7e6692767b70?w=800',
    fullDescription: "Discover your next adventure with gariZetu. we're here to provide you with a seamless car rental experience. Let's get started on your journey.",
  },
];

export default function OnboardingScreen() {
  const [currentIndex, setCurrentIndex] = useState(0);
  const currentSlide = onboardingData[currentIndex];

  const handleNext = () => {
    if (currentIndex < onboardingData.length - 1) {
      setCurrentIndex(currentIndex + 1);
    } else {
      // Navigate to home after onboarding
      router.replace('/(tabs)');
    }
  };

  const handleSkip = () => {
    router.replace('/(tabs)');
  };

  return (
    <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
      <ImageBackground
        source={{ uri: currentSlide.image }}
        style={styles.backgroundImage}
        imageStyle={styles.imageStyle}>
        <View style={styles.overlay} />
        
        {/* Header */}
        <View style={styles.header}>
          <View style={styles.logoContainer}>
            <GarizetuLogo size={40} />
            <Text style={styles.appName}>Gari Zetu</Text>
          </View>
          <Pressable onPress={handleSkip} style={styles.skipButton}>
            <Text style={styles.skipText}>Skip</Text>
          </Pressable>
        </View>
        {/* Content */}
        <View style={styles.content}>
          <Text style={styles.title}>{currentSlide.title}</Text>
          {currentSlide.subtitle && (
            <Text style={styles.subtitle}>{currentSlide.subtitle}</Text>
          )}
          {currentSlide.description && (
            <Text style={styles.description}>{currentSlide.description}</Text>
          )}
          {currentSlide.fullDescription && (
            <Text style={styles.fullDescription}>{currentSlide.fullDescription}</Text>
          )}
        </View>

        {/* Navigation dots */}
        <View style={styles.dotsContainer}>
          {onboardingData.map((_, index) => (
            <View
              key={index}
              style={[
                styles.dot,
                index === currentIndex ? styles.activeDot : styles.inactiveDot,
              ]}
            />
          ))}
        </View>

        {/* Get Started button */}
        <Pressable onPress={handleNext} style={styles.button}>
          <Text style={styles.buttonText}>
            {currentIndex === onboardingData.length - 1 ? 'Get Started' : 'Next'}
          </Text>
        </Pressable>
      </ImageBackground>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  backgroundImage: {
    flex: 1,
    width: '100%',
    height: '100%',
  },
  imageStyle: {
    opacity: 0.3,
  },
  overlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: '#000',
    opacity: 0.7,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingTop: 20,
    zIndex: 2,
  },
  logoContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  logo: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: '#FFF',
    justifyContent: 'center',
    alignItems: 'center',
  },
  logoIcon: {
    fontSize: 24,
  },
  skipButton: {
    paddingHorizontal: 10,
    paddingVertical: 6,
  },
  skipText: {
    color: '#FFF',
    fontSize: 16,
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    paddingHorizontal: 24,
    marginTop: 100,
  },
  title: {
    fontSize: 42,
    fontWeight: 'bold',
    color: '#FFF',
    marginBottom: 12,
    lineHeight: 50,
  },
  subtitle: {
    fontSize: 42,
    fontWeight: 'bold',
    color: '#FFF',
    marginBottom: 12,
    lineHeight: 50,
  },
  description: {
    fontSize: 42,
    fontWeight: 'bold',
    color: '#FFF',
    marginBottom: 24,
    lineHeight: 50,
  },
  fullDescription: {
    fontSize: 16,
    color: '#FFF',
    lineHeight: 24,
    opacity: 0.9,
    marginTop: 16,
  },
  dotsContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 40,
    gap: 8,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  activeDot: {
    backgroundColor: '#FFF',
    width: 24,
  },
  inactiveDot: {
    backgroundColor: '#FFF',
    opacity: 0.4,
  },
  button: {
    backgroundColor: '#2C2C2C',
    marginHorizontal: 24,
    marginBottom: 40,
    paddingVertical: 18,
    borderRadius: 12,
    alignItems: 'center',
  },
  appName: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#FFF',
  },
  buttonText: {
    color: '#FFF',
    fontSize: 18,
    fontWeight: '600',
  },
});

