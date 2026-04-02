/**
 * Pi-DCP: Dynamic Context Pruning Extension
 *
 * Intelligently prunes conversation context to optimize token usage
 * while preserving conversation coherence.
 *
 * Features:
 * - Deduplication: Remove duplicate tool outputs
 * - Superseded writes: Remove older file versions
 * - Error purging: Remove resolved errors
 * - Recency protection: Always keep recent messages
 *
 * Architecture:
 * - Prepare phase: Rules annotate message metadata
 * - Process phase: Rules make pruning decisions
 * - Filter phase: Remove pruned messages
 */

import type { ExtensionAPI } from "@mariozechner/pi-coding-agent";
import { createContextEventHandler } from "./src/events/context";

// Register all built-in rules on import
import { registerRule } from "./src/registry";
import { deduplicationRule } from "./src/rules/deduplication";
import { supersededWritesRule } from "./src/rules/superseded-writes";
import { errorPurgingRule } from "./src/rules/error-purging";
import { toolPairingRule } from "./src/rules/tool-pairing";
import { recencyRule } from "./src/rules/recency";
import { DcpConfigWithPruneRuleObjects, StatsTracker } from "./src/types";

const DEFAULT_CONFIG: DcpConfigWithPruneRuleObjects = {
	enabled: true,
	debug: true,
	keepRecentCount: 10,
	rules: [deduplicationRule, supersededWritesRule, errorPurgingRule, toolPairingRule, recencyRule],
};
for (const rule of DEFAULT_CONFIG.rules) {
	registerRule(rule);
}

export default async function (pi: ExtensionAPI) {
	const config = DEFAULT_CONFIG;
	if (!config.enabled) {
		return; // Exit early if extension is disabled
	}

	// Track stats across session
	const statsTracker: StatsTracker = {
		totalPruned: 0,
		totalProcessed: 0,
	};

	// Hook into context event (before each LLM call)
	pi.on("context", createContextEventHandler({ config, statsTracker }));
}

