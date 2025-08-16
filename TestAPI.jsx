// TestAPI.jsx - React Native component to test API connection
import React, { useState } from 'react';
import { View, Text, TouchableOpacity, ScrollView, StyleSheet, Alert } from 'react-native';
import authService from '../services/authService';

const TestAPI = () => {
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);

  const addResult = (test, success, data = null, error = null) => {
    setResults(prev => [...prev, {
      test,
      success,
      data,
      error,
      timestamp: new Date().toLocaleTimeString()
    }]);
  };

  const clearResults = () => {
    setResults([]);
  };

  const testHealthCheck = async () => {
    try {
      const health = await authService.checkHealth();
      addResult('Health Check', health.status === 'healthy', health);
    } catch (error) {
      addResult('Health Check', false, null, error.message);
    }
  };

  const testLogin = async () => {
    try {
      const user = await authService.login('admin@techcorp.com', 'password123');
      addResult('Login', true, { name: user.name, role: user.role, email: user.email });
    } catch (error) {
      addResult('Login', false, null, error.message);
    }
  };

  const testGetProfile = async () => {
    try {
      const profile = await authService.getProfile();
      addResult('Get Profile', true, { name: profile.name, role: profile.role });
    } catch (error) {
      addResult('Get Profile', false, null, error.message);
    }
  };

  const testGetUsers = async () => {
    try {
      const users = await authService.getUsers();
      addResult('Get Users', true, { count: users.length, users: users.slice(0, 3) });
    } catch (error) {
      addResult('Get Users', false, null, error.message);
    }
  };

  const runAllTests = async () => {
    setLoading(true);
    clearResults();
    
    await testHealthCheck();
    await new Promise(resolve => setTimeout(resolve, 500));
    
    await testLogin();
    await new Promise(resolve => setTimeout(resolve, 500));
    
    await testGetProfile();
    await new Promise(resolve => setTimeout(resolve, 500));
    
    await testGetUsers();
    
    setLoading(false);
    
    const successCount = results.filter(r => r.success).length;
    Alert.alert(
      'Tests Complete',
      `${successCount}/${results.length} tests passed`,
      [{ text: 'OK' }]
    );
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>API Connection Test</Text>
      
      <View style={styles.buttonContainer}>
        <TouchableOpacity 
          style={[styles.button, styles.primaryButton]} 
          onPress={runAllTests}
          disabled={loading}
        >
          <Text style={styles.buttonText}>
            {loading ? 'Running Tests...' : 'Run All Tests'}
          </Text>
        </TouchableOpacity>
        
        <TouchableOpacity 
          style={[styles.button, styles.secondaryButton]} 
          onPress={clearResults}
        >
          <Text style={styles.secondaryButtonText}>Clear Results</Text>
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.resultsContainer}>
        {results.map((result, index) => (
          <View key={index} style={[
            styles.resultItem,
            result.success ? styles.successItem : styles.errorItem
          ]}>
            <View style={styles.resultHeader}>
              <Text style={styles.resultTitle}>
                {result.success ? '✅' : '❌'} {result.test}
              </Text>
              <Text style={styles.timestamp}>{result.timestamp}</Text>
            </View>
            
            {result.data && (
              <Text style={styles.resultData}>
                Data: {JSON.stringify(result.data, null, 2)}
              </Text>
            )}
            
            {result.error && (
              <Text style={styles.resultError}>
                Error: {result.error}
              </Text>
            )}
          </View>
        ))}
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    backgroundColor: '#f5f5f5',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 20,
    color: '#333',
  },
  buttonContainer: {
    flexDirection: 'row',
    marginBottom: 20,
    gap: 10,
  },
  button: {
    flex: 1,
    padding: 15,
    borderRadius: 8,
    alignItems: 'center',
  },
  primaryButton: {
    backgroundColor: '#10b981',
  },
  secondaryButton: {
    backgroundColor: '#6b7280',
  },
  buttonText: {
    color: 'white',
    fontWeight: 'bold',
    fontSize: 16,
  },
  secondaryButtonText: {
    color: 'white',
    fontWeight: 'bold',
    fontSize: 16,
  },
  resultsContainer: {
    flex: 1,
  },
  resultItem: {
    backgroundColor: 'white',
    padding: 15,
    marginBottom: 10,
    borderRadius: 8,
    borderLeftWidth: 4,
  },
  successItem: {
    borderLeftColor: '#10b981',
  },
  errorItem: {
    borderLeftColor: '#ef4444',
  },
  resultHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  resultTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
  },
  timestamp: {
    fontSize: 12,
    color: '#666',
  },
  resultData: {
    fontSize: 12,
    color: '#10b981',
    fontFamily: 'monospace',
    backgroundColor: '#f0fdf4',
    padding: 8,
    borderRadius: 4,
    marginTop: 5,
  },
  resultError: {
    fontSize: 12,
    color: '#ef4444',
    fontFamily: 'monospace',
    backgroundColor: '#fef2f2',
    padding: 8,
    borderRadius: 4,
    marginTop: 5,
  },
});

export default TestAPI;