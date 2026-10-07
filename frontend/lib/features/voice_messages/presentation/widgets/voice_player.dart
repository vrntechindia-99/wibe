import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:audioplayers/audioplayers.dart';

import '../../../../../core/constants/colors.dart';
import '../../../../../core/theme/app_theme.dart';
import '../../../../domain/entities/voice_message.dart';

class WibeVoicePlayer extends ConsumerStatefulWidget {
  final VoiceMessage voiceMessage;
  final bool isSentByMe;
  final VoidCallback? onTap;
  final VoidCallback? onLongPress;

  const WibeVoicePlayer({
    super.key,
    required this.voiceMessage,
    required this.isSentByMe,
    this.onTap,
    this.onLongPress,
  });

  @override
  ConsumerState<WibeVoicePlayer> createState() => _WibeVoicePlayerState();
}

class _WibeVoicePlayerState extends ConsumerState<WibeVoicePlayer>
    with SingleTickerProviderStateMixin {
  late AudioPlayer _audioPlayer;
  bool _isPlaying = false;
  Duration _position = Duration.zero;
  Duration _duration = Duration.zero;
  double _playbackProgress = 0.0;
  late AnimationController _waveAnimationController;
  StreamSubscription? _positionSubscription;
  StreamSubscription? _durationSubscription;
  StreamSubscription? _stateSubscription;

  @override
  void initState() {
    super.initState();
    _audioPlayer = AudioPlayer();
    _waveAnimationController = AnimationController(
      duration: const Duration(milliseconds: 800),
      vsync: this,
    );
    _setupAudioPlayer();
  }

  void _setupAudioPlayer() {
    _positionSubscription = _audioPlayer.onPositionChanged.listen((position) {
      if (mounted) {
        setState(() {
          _position = position;
          _playbackProgress = _duration.inMilliseconds > 0
              ? position.inMilliseconds / _duration.inMilliseconds
              : 0.0;
        });
      }
    });

    _durationSubscription = _audioPlayer.onDurationChanged.listen((duration) {
      if (mounted) {
        setState(() => _duration = duration);
      }
    });

    _stateSubscription = _audioPlayer.onPlayerStateChanged.listen((state) {
      if (mounted) {
        setState(() {
          _isPlaying = state == PlayerState.playing;
          if (_isPlaying) {
            _waveAnimationController.repeat(reverse: true);
          } else {
            _waveAnimationController.stop();
            _waveAnimationController.reset();
          }
        });
      }
    });

    _audioPlayer.onPlayerComplete.listen((_) {
      if (mounted) {
        setState(() {
          _isPlaying = false;
          _position = Duration.zero;
          _playbackProgress = 0.0;
          _waveAnimationController.stop();
          _waveAnimationController.reset();
        });
      }
    });
  }

  @override
  void dispose() {
    _positionSubscription?.cancel();
    _durationSubscription?.cancel();
    _stateSubscription?.cancel();
    _audioPlayer.dispose();
    _waveAnimationController.dispose();
    super.dispose();
  }

  Future<void> _togglePlay() async {
    if (_isPlaying) {
      await _audioPlayer.pause();
    } else {
      await _audioPlayer.play(UrlSource(widget.voiceMessage.audioUrl));
    }
  }

  Future<void> _seek(double progress) async {
    final position = Duration(
      milliseconds: (_duration.inMilliseconds * progress).round(),
    );
    await _audioPlayer.seek(position);
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
    final waveform = widget.voiceMessage.waveform ?? _generateMockWaveform();

    return GestureDetector(
      onTap: widget.onTap,
      onLongPress: widget.onLongPress,
      child: Container(
        constraints: BoxConstraints(
          maxWidth: MediaQuery.of(context).size.width * 0.7,
          minHeight: 60,
        ),
        padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
        decoration: BoxDecoration(
          color: widget.isSentByMe
              ? (isDark ? WibeColors.darkOutgoingBubble : WibeColors.lightOutgoingBubble)
              : (isDark ? WibeColors.darkIncomingBubble : WibeColors.lightIncomingBubble),
          borderRadius: BorderRadius.only(
            topLeft: const Radius.circular(16),
            topRight: const Radius.circular(16),
            bottomLeft: widget.isSentByMe ? const Radius.circular(16) : const Radius.circular(24),
            bottomRight: widget.isSentByMe ? const Radius.circular(24) : const Radius.circular(16),
          ),
        ),
        child: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            Row(
              children: [
                // Play/Pause button
                Container(
                  width: 44,
                  height: 44,
                  decoration: BoxDecoration(
                    color: widget.isSentByMe
                        ? (isDark ? WibeColors.primaryLight.withOpacity(0.3) : WibeColors.primary.withOpacity(0.2))
                        : (isDark ? WibeColors.darkSurface : WibeColors.lightSurface),
                    shape: BoxShape.circle,
                  ),
                  child: IconButton(
                    icon: Icon(
                      _isPlaying ? Icons.pause : Icons.play_arrow,
                      color: widget.isSentByMe
                          ? (isDark ? WibeColors.primaryLight : WibeColors.primary)
                          : (isDark ? WibeColors.primaryLight : WibeColors.primary),
                      size: 24,
                    ),
                    onPressed: _togglePlay,
                  ),
                ),
                const SizedBox(width: 12),
                // Waveform with progress
                Expanded(
                  child: SizedBox(
                    height: 44,
                    child: _buildWaveformWithProgress(
                      widget.voiceMessage.waveform ?? _generateMockWaveform(),
                    ),
                  ),
                ),
                const SizedBox(width: 12),
                // Duration
                Text(
                  widget.voiceMessage.formattedDuration,
                  style: theme.textTheme.bodySmall?.copyWith(
                    color: widget.isSentByMe
                        ? (isDark ? Colors.white70 : WibeColors.lightTextSecondary)
                        : (isDark ? WibeColors.darkTextSecondary : WibeColors.lightTextSecondary),
                  ),
                ),
              ],
            ),
            // Progress bar
            if (_duration.inMilliseconds > 0) ...[
              const SizedBox(height: 4),
              Stack(
                children: [
                  Container(
                    height: 2,
                    decoration: BoxDecoration(
                      color: theme.colorScheme.onSurfaceVariant.withOpacity(0.3),
                      borderRadius: BorderRadius.circular(1),
                    ),
                  ),
                  FractionallySizedBox(
                    widthFactor: _playbackProgress.clamp(0.0, 1.0),
                    child: Container(
                      height: 2,
                      decoration: BoxDecoration(
                        color: widget.isSentByMe
                            ? (isDark ? WibeColors.primaryLight : WibeColors.primary)
                            : (isDark ? WibeColors.primaryLight : WibeColors.primary),
                        borderRadius: BorderRadius.circular(1),
                      ),
                    ),
                  ),
                ],
              ),
              const SizedBox(height: 2),
              Row(
                mainAxisAlignment: MainAxisAlignment.spaceBetween,
                children: [
                  Text(
                    _formatDuration(_position),
                    style: theme.textTheme.labelSmall?.copyWith(
                      color: theme.colorScheme.onSurfaceVariant,
                      fontSize: 10,
                    ),
                  ),
                  Text(
                    widget.voiceMessage.formattedDuration,
                    style: theme.textTheme.labelSmall?.copyWith(
                      color: theme.colorScheme.onSurfaceVariant,
                      fontSize: 10,
                    ),
                  ),
                ],
              ),
            ],
          ],
        ),
      ),
    );
  }

  Widget _buildWaveformWithProgress(List<double> waveform) {
    return AnimatedBuilder(
      animation: _waveAnimationController,
      builder: (context, child) {
        return Row(
          mainAxisAlignment: MainAxisAlignment.center,
          crossAxisAlignment: CrossAxisAlignment.center,
          children: List.generate(waveform.length, (index) {
            final baseHeight = waveform[index] * 30;
            final animatedHeight = _isPlaying 
                ? baseHeight * (0.5 + _waveAnimationController.value * 0.5)
                : baseHeight;
            final isPlayed = index / waveform.length <= _playbackProgress;
            
            return Container(
              width: 3,
              margin: const EdgeInsets.symmetric(horizontal: 1.5),
              height: animatedHeight.clamp(4.0, 30.0),
              decoration: BoxDecoration(
                color: isPlayed
                    ? (widget.isSentByMe
                        ? (Theme.of(context).brightness == Brightness.dark ? WibeColors.primaryLight : WibeColors.primary)
                        : (Theme.of(context).brightness == Brightness.dark ? WibeColors.primaryLight : WibeColors.primary))
                    : (widget.isSentByMe
                        ? (Theme.of(context).brightness == Brightness.dark ? Colors.white38 : Colors.black26)
                        : (Theme.of(context).brightness == Brightness.dark ? Colors.white38 : Colors.black26)),
                borderRadius: BorderRadius.circular(1.5),
              ),
            );
          }),
        );
      },
    );
  }

  Future<void> _togglePlay() async {
    if (_isPlaying) {
      await _audioPlayer.pause();
    } else {
      await _audioPlayer.play(UrlSource(widget.voiceMessage.audioUrl));
    }
  }

  Future<void> _seek(double progress) async {
    final position = Duration(
      milliseconds: (_duration.inMilliseconds * progress).round(),
    );
    await _audioPlayer.seek(position);
  }

  String _formatDuration(Duration duration) {
    String twoDigits(int n) => n.toString().padLeft(2, '0');
    final minutes = twoDigits(duration.inMinutes.remainder(60));
    final seconds = twoDigits(duration.inSeconds.remainder(60));
    return '$minutes:$seconds';
  }

  List<double> _generateMockWaveform() {
    return List.generate(30, (index) => (index % 7 + 1) / 7.0);
  }
}