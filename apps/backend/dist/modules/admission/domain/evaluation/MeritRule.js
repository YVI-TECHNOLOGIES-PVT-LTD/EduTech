"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.MeritComponent = exports.MeritRule = void 0;
class MeritRule {
    constructor(id, schoolId, academicYearId, tieBreakerRules, createdAt) {
        this.id = id;
        this.schoolId = schoolId;
        this.academicYearId = academicYearId;
        this.tieBreakerRules = tieBreakerRules;
        this.createdAt = createdAt;
    }
}
exports.MeritRule = MeritRule;
class MeritComponent {
    constructor(id, ruleId, componentName, weight, active) {
        this.id = id;
        this.ruleId = ruleId;
        this.componentName = componentName;
        this.weight = weight;
        this.active = active;
    }
}
exports.MeritComponent = MeritComponent;
