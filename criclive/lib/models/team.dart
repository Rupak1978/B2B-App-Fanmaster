import 'player.dart';

class Team {
  final String id;
  final String name;
  final String? shortName;
  final List<Player> players;

  const Team({
    required this.id,
    required this.name,
    this.shortName,
    this.players = const [],
  });

  Map<String, dynamic> toJson() => {
        'id': id,
        'name': name,
        'shortName': shortName,
        'players': players.map((p) => p.toJson()).toList(),
      };

  factory Team.fromJson(Map<String, dynamic> json) => Team(
        id: json['id'] as String,
        name: json['name'] as String,
        shortName: json['shortName'] as String?,
        players: (json['players'] as List<dynamic>?)
                ?.map((p) => Player.fromJson(p as Map<String, dynamic>))
                .toList() ??
            [],
      );

  Team copyWith({
    String? id,
    String? name,
    String? shortName,
    List<Player>? players,
  }) {
    return Team(
      id: id ?? this.id,
      name: name ?? this.name,
      shortName: shortName ?? this.shortName,
      players: players ?? this.players,
    );
  }
}
