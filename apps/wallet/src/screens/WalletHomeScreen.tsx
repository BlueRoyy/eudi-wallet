import React from 'react'
import { View, Text, StyleSheet, FlatList } from 'react-native'
import type { StoredCredential } from '@eudi-wallet/core'

interface Props { credentials: StoredCredential[] }

export function WalletHomeScreen({ credentials }: Props) {
  return (
    <View style={styles.container}>
      <Text style={styles.heading}>My credentials</Text>
      {credentials.length === 0 ? (
        <Text style={styles.empty}>No credentials yet. Scan a QR code to add one.</Text>
      ) : (
        <FlatList data={credentials} keyExtractor={(item) => item.id}
          renderItem={({ item }) => (
            <View style={styles.card}>
              <Text style={styles.cardTitle}>{item.displayName}</Text>
              <Text style={styles.cardSub}>{item.issuer}</Text>
            </View>
          )} />
      )}
    </View>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 20, backgroundColor: '#fff' },
  heading: { fontSize: 24, fontWeight: '600', marginBottom: 16 },
  empty: { color: '#888', textAlign: 'center', marginTop: 60 },
  card: { padding: 16, borderRadius: 12, backgroundColor: '#f5f5f5', marginBottom: 12 },
  cardTitle: { fontSize: 16, fontWeight: '600' },
  cardSub: { fontSize: 13, color: '#666', marginTop: 4 },
})
