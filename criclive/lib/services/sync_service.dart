import 'dart:async';
import 'dart:convert';
import 'package:web_socket_channel/web_socket_channel.dart';
import '../models/ball_event.dart';

/// Handles syncing match data to the backend via WebSocket
/// for live audience viewing.
class SyncService {
  WebSocketChannel? _channel;
  Timer? _reconnectTimer;
  final String _serverUrl;
  bool _isConnected = false;
  String? _currentMatchId;

  SyncService({required String serverUrl}) : _serverUrl = serverUrl;

  bool get isConnected => _isConnected;

  /// Connect to the WebSocket server for a specific match.
  Future<void> connect(String matchId) async {
    _currentMatchId = matchId;
    try {
      final uri = Uri.parse('$_serverUrl/ws/match/$matchId');
      _channel = WebSocketChannel.connect(uri);
      _isConnected = true;

      _channel!.stream.listen(
        (message) {
          // Handle incoming messages (e.g., audience count)
        },
        onError: (error) {
          _isConnected = false;
          _scheduleReconnect();
        },
        onDone: () {
          _isConnected = false;
          _scheduleReconnect();
        },
      );
    } catch (e) {
      _isConnected = false;
      _scheduleReconnect();
    }
  }

  /// Send a ball event update to the server.
  void sendBallEvent(BallEvent event) {
    if (!_isConnected || _channel == null) return;
    try {
      _channel!.sink.add(jsonEncode({
        'type': 'ball_event',
        'data': event.toJson(),
      }));
    } catch (_) {
      // Queue for later sync if offline
    }
  }

  /// Send a score update snapshot.
  void sendScoreUpdate(Map<String, dynamic> scoreData) {
    if (!_isConnected || _channel == null) return;
    try {
      _channel!.sink.add(jsonEncode({
        'type': 'score_update',
        'data': scoreData,
      }));
    } catch (_) {
      // Queue for later sync
    }
  }

  void _scheduleReconnect() {
    _reconnectTimer?.cancel();
    _reconnectTimer = Timer(const Duration(seconds: 5), () {
      if (_currentMatchId != null && !_isConnected) {
        connect(_currentMatchId!);
      }
    });
  }

  void disconnect() {
    _reconnectTimer?.cancel();
    _channel?.sink.close();
    _isConnected = false;
    _currentMatchId = null;
  }
}
