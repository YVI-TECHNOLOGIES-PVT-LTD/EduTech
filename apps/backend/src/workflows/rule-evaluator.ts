export class RuleEvaluator {
    /**
     * Resolves dot notation path inside nested object.
     * e.g., resolvePath({ applicant: { gender: 'Male' } }, 'applicant.gender') -> 'Male'
     */
    static resolvePath(obj: any, path: string): any {
        if (!obj || !path) return undefined;
        const parts = path.split('.');
        let current = obj;
        for (const part of parts) {
            if (current === null || current === undefined) return undefined;
            current = current[part];
        }
        return current;
    }

    /**
     * Evaluate rule node conditions structure.
     * e.g., { AND: [ { field: 'rte_category', op: '==', val: 'YES' } ] }
     */
    static evaluate(condition: any, entity: any): boolean {
        if (!condition || Object.keys(condition).length === 0) return true;

        if (condition.AND) {
            if (!Array.isArray(condition.AND)) return false;
            return condition.AND.every((cond: any) => this.evaluate(cond, entity));
        }

        if (condition.OR) {
            if (!Array.isArray(condition.OR)) return false;
            return condition.OR.some((cond: any) => this.evaluate(cond, entity));
        }

        if (condition.NOT) {
            return !this.evaluate(condition.NOT, entity);
        }

        const { field, op, val } = condition;
        if (!field || !op) return false;

        const entityVal = this.resolvePath(entity, field);

        switch (op) {
            case '==':
            case 'equals':
                return String(entityVal) === String(val);
            case '!=':
            case 'not_equals':
                return String(entityVal) !== String(val);
            case '>':
                return Number(entityVal) > Number(val);
            case '<':
                return Number(entityVal) < Number(val);
            case '>=':
                return Number(entityVal) >= Number(val);
            case '<=':
                return Number(entityVal) <= Number(val);
            case 'includes':
                if (Array.isArray(entityVal)) {
                    return entityVal.includes(val);
                }
                return String(entityVal).includes(String(val));
            case 'contains':
                return String(entityVal).toLowerCase().includes(String(val).toLowerCase());
            case 'matches':
                try {
                    const regex = new RegExp(String(val), 'i');
                    return regex.test(String(entityVal));
                } catch {
                    return false;
                }
            default:
                return false;
        }
    }
}
