import 'package:connectivity_plus/connectivity_plus.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

class ConnectivityService {
  final Connectivity _connectivity;
  final Stream<ConnectivityResult> _connectivityStream;

  ConnectivityService(this._connectivity) : _connectivityStream = _connectivity.onConnectivityChanged;

  Stream<ConnectivityResult> get connectivityStream => _connectivityStream;

  Future<ConnectivityResult> checkConnectivity() async {
    return _connectivity.checkConnectivity();
  }

  bool isConnected(ConnectivityResult result) {
    return result != ConnectivityResult.none;
  }
}

final connectivityServiceProvider = Provider<ConnectivityService>((ref) {
  throw UnimplementedError();
});

final connectivityStreamProvider = StreamProvider<ConnectivityResult>((ref) {
  final service = ref.watch(connectivityServiceProvider);
  return service.connectivityStream;
});

final isOnlineProvider = Provider<bool>((ref) {
  final connectivity = ref.watch(connectivityStreamProvider);
  return connectivity.when(
    data: (result) => result != ConnectivityResult.none,
    loading: () => true,
    error: (_, __) => true,
  );
});