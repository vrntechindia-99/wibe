import 'package:equatable/equatable.dart';

class CallOffer extends Equatable {
  final String callId;
  final String from;
  final String sdp;

  const CallOffer({
    required this.callId,
    required this.from,
    required this.sdp,
  });

  factory CallOffer.fromJson(Map<String, dynamic> json) {
    return CallOffer(
      callId: json['callId'] as String,
      from: json['from'] as String,
      sdp: json['sdp'] as String,
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'callId': callId,
      'from': from,
      'sdp': sdp,
    };
  }

  @override
  List<Object?> get props => [callId, from, sdp];
}

class CallAnswer extends Equatable {
  final String callId;
  final String from;
  final String sdp;

  const CallAnswer({
    required this.callId,
    required this.from,
    required this.sdp,
  });

  factory CallAnswer.fromJson(Map<String, dynamic> json) {
    return CallAnswer(
      callId: json['callId'] as String,
      from: json['from'] as String,
      sdp: json['sdp'] as String,
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'callId': callId,
      'from': from,
      'sdp': sdp,
    };
  }

  @override
  List<Object?> get props => [callId, from, sdp];
}

class IceCandidateData extends Equatable {
  final String callId;
  final String from;
  final String candidate;
  final int? sdpMLineIndex;
  final String? sdpMid;

  const IceCandidateData({
    required this.callId,
    required this.from,
    required this.candidate,
    this.sdpMLineIndex,
    this.sdpMid,
  });

  factory IceCandidateData.fromJson(Map<String, dynamic> json) {
    return IceCandidateData(
      callId: json['callId'] as String,
      from: json['from'] as String,
      candidate: json['candidate'] as String,
      sdpMLineIndex: json['sdpMLineIndex'] as int?,
      sdpMid: json['sdpMid'] as String?,
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'callId': callId,
      'from': from,
      'candidate': candidate,
      if (sdpMLineIndex != null) 'sdpMLineIndex': sdpMLineIndex,
      if (sdpMid != null) 'sdpMid': sdpMid,
    };
  }

  @override
  List<Object?> get props => [callId, from, candidate, sdpMLineIndex, sdpMid];
}

enum CallSignalingType {
  callStart,
  callRinging,
  callAccepted,
  callDeclined,
  callCancelled,
  callEnded,
  callEndedByMe,
  callEndedByOther,
  callOffer,
  callAnswer,
  iceCandidate,
  callFailed,
  callMissed,
  callCancelled,
}