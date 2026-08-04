"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Holiday = void 0;
class Holiday {
    constructor(id, schoolId, holidayDate, name, description, createdAt) {
        this.id = id;
        this.schoolId = schoolId;
        this.holidayDate = holidayDate;
        this.name = name;
        this.description = description;
        this.createdAt = createdAt;
    }
}
exports.Holiday = Holiday;
