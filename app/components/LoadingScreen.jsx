const LoadingScreen = ({ message = "Loading..." }) => {
  return (
    <View style={styles.loadingContainer}>
      <Text style={styles.loadingText}>{message}</Text>
    </View>
  )
}