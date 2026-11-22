// ---- Solo-bot harness hook (appended; not part of Rally the Troops) ----
const __API = {
    data, fire_table,
    get game() { return game },
    AP, CP, AP_RESERVE_BOX, CP_RESERVE_BOX, AP_ELIMINATED_BOX, CP_ELIMINATED_BOX, PERM_ELIMINATED_BOX, map_space_count,
    active_faction, other_faction, is_controlled_by, get_trench_level, get_trench_level_for_attack, has_undestroyed_fort,
    is_unit_supplied, is_space_supplied, get_piece_cf, get_piece_mf, get_attackable_spaces, cost_to_activate, get_fire_col,
    get_connected_spaces, can_move_to, can_end_move, nation_at_war, is_space_at_war, get_pieces_in_space, is_besieged,
    get_sr_destinations, can_sr, is_unit_reduced, satisfies_mo, can_play_event, is_neareast_space,
    contains_piece_of_faction, update_supply, is_port, is_bef_unit, is_minor_british_nation, is_fully_stacked,
}
exports.__with = function (state, fn) { game = state; update_supply_if_missing(); return fn(__API) }
exports.__api = __API
