class Player {
  final String id;
  final String name;
  final String teamId;

  const Player({
    required this.id,
    required this.name,
    required this.teamId,
  });

  Map<String, dynamic> toJson() => {
        'id': id,
        'name': name,
        'teamId': teamId,
      };

  factory Player.fromJson(Map<String, dynamic> json) => Player(
        id: json['id'] as String,
        name: json['name'] as String,
        teamId: json['teamId'] as String,
      );
}
