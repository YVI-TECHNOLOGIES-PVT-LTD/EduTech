import { FeatureFlagDefinition } from '../contracts/feature-flag.contracts';

export class DependencyResolver {
  public static areDependenciesSatisfied(
    flag: FeatureFlagDefinition,
    evaluatorFn: (key: string) => boolean,
  ): boolean {
    if (!flag.dependsOn || flag.dependsOn.length === 0) return true;
    return flag.dependsOn.every((depKey) => evaluatorFn(depKey));
  }
}
