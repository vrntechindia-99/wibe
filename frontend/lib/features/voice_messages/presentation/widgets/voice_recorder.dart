import 'dart:async';
import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:permission_handler/permission_handler.dart';
import 'package:audioplayers/audioplayers.dart';

import '../../../../../core/constants/colors.dart';
import '../../../../../core/theme/app_theme.dart';
import '../../../../domain/entities/voice_message.dart';

class WibeVoiceRecorder extends ConsumerStatefulWidget {
  final Function(String audioPath, int durationMs, List<double> waveform) onRecordingComplete;
  final VoidCallback? onCancel;

  const WibeVoiceRecorder({
    super.key,
    required this.onRecordingComplete,
    this.onCancel,
  });

  @override
  ConsumerState<WibeVoiceRecorder> createState() => _WibeVoiceRecorderState();
}

class _WibeVoiceRecorderState extends ConsumerState<WibeVoiceRecorder>
    with SingleTickerProviderStateMixin {
  RecordingState _state = RecordingState.idle;
  Duration _duration = Duration.zero;
  Timer? _timer;
  String? _audioPath;
  List<double> _waveform = [];
  double _currentAmplitude = 0.0;
  double _dragOffset = 0.0;
  bool _isLocked = false;
  late AnimationController _waveAnimationController;
  late AnimationController _lockAnimationController;
  final AudioRecorder _audioRecorder = AudioRecorder();

  @override
  void initState() {
    super.initState();
    _waveAnimationController = AnimationController(
      duration: const Duration(milliseconds: 100),
      vsync: this,
    );
    _lockAnimationController = AnimationController(
      duration: const Duration(milliseconds: 300),
      vsync: this,
    );
  }

  @override
  void dispose() {
    _timer?.cancel();
    _waveAnimationController.dispose();
    _lockAnimationController.dispose();
    _audioRecorder.dispose();
    super.dispose();
  }

  Future<void> _requestPermission() async {
    final status = await Permission.microphone.request();
    if (!status.isGranted) {
      if (mounted) {
        _showPermissionDialog();
      }
      return false;
    }
    return true;
  }

  void _showPermissionDialog() {
    showDialog(
      context: context,
      builder: (context) => AlertDialog(
        title: const Text('Microphone Permission'),
        content: const Text(
          'Wibe needs microphone access to record voice messages. '
          'Please enable it in settings.',
        ),
        actions: [
          TextButton(
            onPressed: () => Navigator.pop(context),
            child: const Text('Cancel'),
          ),
          TextButton(
            onPressed: () {
              Navigator.pop(context);
              openAppSettings();
            },
            child: const Text('Open Settings'),
          ),
        ],
      ),
    );
  }

  Future<void> _startRecording() async {
    final hasPermission = await _requestPermission();
    if (!hasPermission) return;

    setState(() {
      _state = RecordingState.recording;
      _duration = Duration.zero;
      _waveform = [];
      _currentAmplitude = 0.0;
    });

    _timer = Timer.periodic(const Duration(milliseconds: 100), (_) {
      setState(() {
        _duration += const Duration(milliseconds: 100);
        // Simulate amplitude for waveform
        _currentAmplitude = (0.3 + (0.7 * (DateTime.now().millisecond % 100) / 100)).clamp(0.0, 1.0);
        _waveform.add(_currentAmplitude);
        if (_waveform.length > 100) _waveform.removeAt(0);
      });
      _waveAnimationController.forward(from: 0);
    });

    // Start actual recording
    try {
      await _audioRecorder.start(const RecordConfig(
        encoder: AudioEncoder.aacLc,
        bitRate: 128000,
        sampleRate: 44100,
      ));
    } catch (e) {
      debugPrint('Recording start error: $e');
    }
  }

  Future<void> _stopRecording() async {
    _timer?.cancel();
    
    final path = await _audioRecorder.stop();
    _audioPath = path;

    setState(() {
      _state = RecordingState.stopped;
    });

    // Process waveform - normalize and compress
    final processedWaveform = _processWaveform(_waveform);

    if (_audioPath != null) {
      widget.onRecordingComplete(_audioPath!, _duration.inMilliseconds, processedWaveform);
    }
  }

  Future<void> _cancelRecording() async {
    _timer?.cancel();
    await _audioRecorder.stop();
    widget.onCancel?.call();
    setState(() => _state = RecordingState.idle);
  }

  Future<void> _lockRecording() async {
    setState(() {
      _isLocked = true;
      _state = RecordingState.locked;
    });
    _lockAnimationController.forward();
  }

  Future<void> _unlockRecording() async {
    setState(() {
      _isLocked = false;
      _state = RecordingState.recording;
    });
    _lockAnimationController.reverse();
  }

  List<double> _processWaveform(List<double> rawWaveform) {
    // Compress to ~50 points for storage
    if (rawWaveform.length <= 50) return rawWaveform;
    
    final step = rawWaveform.length / 50;
    return List.generate(50, (i) {
      final start = (i * step).floor();
      final end = ((i + 1) * step).floor();
      final slice = rawWaveform.sublist(start, end);
      return slice.reduce((a, b) => a + b) / slice.length;
    });
  }

  String _formatDuration(Duration duration) {
    String twoDigits(int n) => n.toString().padLeft(2, '0');
    final minutes = twoDigits(duration.inMinutes.remainder(60));
    final seconds = twoDigits(duration.inSeconds.remainder(60));
    return '$minutes:$seconds';
  }

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    final isDark = theme.brightness == Brightness.dark;

    return Container(
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: theme.colorScheme.surface,
        borderRadius: const BorderRadius.vertical(top: Radius.circular(20)),
        boxShadow: [
          BoxShadow(
            color: Colors.black.withOpacity(0.1),
            blurRadius: 20,
            offset: const Offset(0, -5),
          ),
        ],
      ),
      child: Column(
        mainAxisSize: MainAxisSize.min,
        children: [
          // Handle bar
          Container(
            width: 40,
            height: 4,
            margin: const EdgeInsets.only(bottom: 16),
            decoration: BoxDecoration(
              color: theme.colorScheme.onSurfaceVariant.withOpacity(0.3),
              borderRadius: BorderRadius.circular(2),
            ),
          ),
          
          // State-specific UI
          if (_state == RecordingState.idle) _buildIdleState()
          else if (_state == RecordingState.recording || _state == RecordingState.locked)
            _buildRecordingState()
          else if (_state == RecordingState.stopped) _buildPreviewState(),
          
          const SizedBox(height: 16),
        ],
      ),
    );
  }

  Widget _buildIdleState() {
    final theme = Theme.of(context);
    
    return Column(
      children: [
        Text(
          'Hold to record',
          style: theme.textTheme.titleMedium?.copyWith(
            color: theme.colorScheme.onSurfaceVariant,
          ),
        ),
        const SizedBox(height: 24),
        GestureDetector(
          onLongPressStart: (_) => _startRecording(),
          onLongPressEnd: (_) => _stopRecording(),
          onLongPressUp: () {},
          child: AnimatedContainer(
            duration: const Duration(milliseconds: 200),
            width: 80,
            height: 80,
            decoration: BoxDecoration(
              color: WibeColors.error.withOpacity(0.1),
              shape: BoxShape.circle,
              border: Border.all(color: WibeColors.error, width: 3),
            ),
            child: Center(
              child: Icon(
                Icons.mic,
                size: 36,
                color: WibeColors.error,
              ),
            ),
          ),
          const SizedBox(height: 16),
          Text(
            'Slide up to lock',
            style: theme.textTheme.bodySmall?.copyWith(
              color: theme.colorScheme.onSurfaceVariant,
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildRecordingState() {
    final theme = Theme.of(context);
    
    return Column(
      children: [
        // Duration
        Text(
          _formatDuration(_duration),
          style: theme.textTheme.headlineMedium?.copyWith(
            fontWeight: FontWeight.w600,
            fontFamily: 'monospace',
            color: WibeColors.error,
          ),
        ),
        const SizedBox(height: 24),
        
        // Waveform visualization
        SizedBox(
          height: 60,
          child: AnimatedBuilder(
            animation: _waveAnimationController,
            builder: (context, child) {
              return _buildLiveWaveform();
            },
          ),
        ),
        const SizedBox(height: 24),
        
        // Lock indicator
        if (_state == RecordingState.locked)
          Container(
            padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
            decoration: BoxDecoration(
              color: WibeColors.primary.withOpacity(0.1),
              borderRadius: BorderRadius.circular(20),
            ),
            child: Row(
              mainAxisSize: MainAxisSize.min,
              children: [
                Icon(Icons.lock, size: 16, color: WibeColors.primary),
                const SizedBox(width: 8),
                Text(
                  'Locked - Tap to stop',
                  style: theme.textTheme.bodySmall?.copyWith(
                    color: WibeColors.primary,
                    fontWeight: FontWeight.w600,
                  ),
                ),
              ],
            ),
          )
        else
          Text(
            'Slide up to lock • Release to send',
            style: theme.textTheme.bodySmall?.copyWith(
              color: theme.colorScheme.onSurfaceVariant,
            ),
          ),
        const SizedBox(height: 32),
        
        // Control buttons
        Row(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            // Cancel
            _buildControlButton(
              icon: Icons.close,
              label: 'Cancel',
              color: theme.colorScheme.onSurfaceVariant,
              onTap: _cancelRecording,
            ),
            const SizedBox(width: 40),
            // Stop/Lock
            _buildControlButton(
              icon: _state == RecordingState.locked ? Icons.stop : Icons.lock_open,
              label: _state == RecordingState.locked ? 'Stop' : 'Lock',
              color: WibeColors.error,
              onTap: _state == RecordingState.locked ? _stopRecording : _lockRecording,
              isPrimary: true,
            ),
          ],
        ),
      ],
    );
  }

  Widget _buildLiveWaveform() {
    return Center(
      child: SizedBox(
        height: 60,
        width: 300,
        child: Row(
          mainAxisAlignment: MainAxisAlignment.center,
          crossAxisAlignment: CrossAxisAlignment.center,
          children: List.generate(30, (index) {
            final waveIndex = index < _waveform.length ? index : _waveform.length - 1;
            final amplitude = waveIndex >= 0 && waveIndex < _waveform.length 
                ? _waveform[waveIndex] 
                : 0.0;
            final height = (amplitude * 40).clamp(4.0, 40.0);
            
            return AnimatedContainer(
              duration: const Duration(milliseconds: 50),
              width: 4,
              margin: const EdgeInsets.symmetric(horizontal: 2),
              height: height,
              decoration: BoxDecoration(
                color: WibeColors.error.withOpacity(0.5 + amplitude * 0.5),
                borderRadius: BorderRadius.circular(2),
              ),
            );
          }),
        ),
      );
    }

  Widget _buildPreviewState() {
    final theme = Theme.of(context);
    
    return Column(
      children: [
        Text(
          'Voice Message',
          style: theme.textTheme.titleMedium?.copyWith(
            fontWeight: FontWeight.w600,
          ),
        ),
        const SizedBox(height: 16),
        Container(
          padding: const EdgeInsets.all(16),
          decoration: BoxDecoration(
            color: theme.colorScheme.surfaceVariant,
            borderRadius: BorderRadius.circular(16),
          ),
          child: Row(
            children: [
              Icon(Icons.mic, size: 32, color: WibeColors.primary),
              const SizedBox(width: 16),
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(
                      'Voice Message',
                      style: theme.textTheme.titleSmall?.copyWith(
                        fontWeight: FontWeight.w600,
                      ),
                    ),
                    Text(
                      _formatDuration(_duration),
                      style: theme.textTheme.bodySmall?.copyWith(
                        color: theme.colorScheme.onSurfaceVariant,
                      ),
                    ),
                  ],
                ),
              ),
              IconButton(
                icon: Icon(Icons.play_arrow, color: WibeColors.primary, size: 28),
                onPressed: _playPreview,
              ),
            ],
          ),
        ),
        const SizedBox(height: 24),
        Row(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            _buildControlButton(
              icon: Icons.delete,
              label: 'Delete',
              color: WibeColors.error,
              onTap: () => setState(() => _state = RecordingState.idle),
            ),
            const SizedBox(width: 24),
            _buildControlButton(
              icon: Icons.send,
              label: 'Send',
              color: WibeColors.primary,
              onTap: () {
                if (_audioPath != null) {
                  widget.onRecordingComplete(_audioPath!, _duration.inMilliseconds, _waveform);
                }
              },
              isPrimary: true,
            ),
          ],
        ),
      ],
    );
  }

  Widget _buildControlButton({
    required IconData icon,
    required String label,
    required Color color,
    required VoidCallback onTap,
    bool isPrimary = false,
  }) {
    return Column(
      children: [
        Container(
          width: 60,
          height: 60,
          decoration: BoxDecoration(
            color: isPrimary ? color : color.withOpacity(0.1),
            shape: BoxShape.circle,
            border: isPrimary ? null : Border.all(color: color.withOpacity(0.3)),
          ),
          child: IconButton(
            icon: Icon(icon, color: isPrimary ? Colors.white : color, size: 24),
            onPressed: onTap,
          ),
        ),
        const SizedBox(height: 4),
        Text(
          label,
          style: Theme.of(context).textTheme.labelSmall?.copyWith(
            color: color,
            fontWeight: FontWeight.w500,
          ),
        ),
      ],
    );
  }

  Future<void> _playPreview() async {
    if (_audioPath == null) return;
    final player = AudioPlayer();
    await player.play(DeviceFileSource(_audioPath!));
    // TODO: Handle completion
  }
}