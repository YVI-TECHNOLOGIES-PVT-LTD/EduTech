import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Image, ScrollView } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useChildStore } from '../../stores/child.store';
import { Avatar } from '../ui/atoms/Avatar';
import { DESIGN_TOKENS } from '../../theme/tokens/designTokens';

export interface SelectedChildCardProps {
  onOpenSwitcher?: () => void;
  showSwitchButton?: boolean;
}

/**
 * Format standard grades for short display pills, e.g. "Grade 2" -> "Gr 2", "Kindergarten" -> "KG"
 */
function formatShortGrade(grade?: string | null): string {
  if (!grade) return 'Gr -';
  const clean = grade.trim();
  const match = clean.match(/(?:grade|class|standard|std)?\s*([0-9]+[a-z]?)/i);
  if (match) return `Gr ${match[1]}`;
  if (/kindergarten|kg/i.test(clean)) return 'KG';
  if (/nursery/i.test(clean)) return 'Nur';
  return clean.slice(0, 5);
}

const ChildChipAvatar: React.FC<{ uri?: string | null; name: string }> = ({ uri, name }) => {
  const [error, setError] = React.useState(false);

  React.useEffect(() => {
    setError(false);
  }, [uri]);

  if (uri && !error) {
    return <Image source={{ uri }} style={styles.chipAvatarImage} onError={() => setError(true)} />;
  }

  return (
    <View style={styles.chipAvatarFallback}>
      <Text style={styles.chipAvatarFallbackText}>{(name[0] || 'S').toUpperCase()}</Text>
    </View>
  );
};

export const SelectedChildCard: React.FC<SelectedChildCardProps> = React.memo(
  ({ onOpenSwitcher, showSwitchButton = true }) => {
    const activeChild = useChildStore((s) => s.getSelectedChild());
    const children = useChildStore((s) => s.children);
    const canSwitch = showSwitchButton && Boolean(onOpenSwitcher);
    const [mainAvatarError, setMainAvatarError] = React.useState(false);

    React.useEffect(() => {
      setMainAvatarError(false);
    }, [activeChild?.id, activeChild?.avatarUrl]);

    if (!activeChild) {
      return (
        <View style={styles.cardContainer}>
          <View style={styles.contentRow}>
            <View style={styles.emptyAvatarCircle}>
              <Ionicons name="people" size={24} color={DESIGN_TOKENS.colors.royalIndigo} />
            </View>
            <View style={styles.detailsColumn}>
              <Text style={styles.studentName}>No Student Selected</Text>
              <Text style={styles.studentSubtext}>Select or link a child profile</Text>
            </View>
          </View>
          {onOpenSwitcher && (
            <TouchableOpacity
              onPress={onOpenSwitcher}
              activeOpacity={0.8}
              style={styles.switchButtonSmall}
              accessibilityRole="button"
              accessibilityLabel="Select student"
            >
              <Text style={styles.switchButtonSmallText}>Select</Text>
            </TouchableOpacity>
          )}
        </View>
      );
    }

    const isEnrolled = activeChild.kind === 'enrolled';
    const statusLabel = isEnrolled ? 'ENROLLED' : 'APPLICANT';

    // Format grade and section cleanly without duplication
    const formatGrade = (grade?: string) => {
      if (!grade) return 'Class';
      return grade.toLowerCase().startsWith('grade') ? grade : `Grade ${grade}`;
    };

    const gradeSectionText = isEnrolled
      ? `${formatGrade(activeChild.gradeLevel)}${activeChild.section ? `, Section ${activeChild.section}` : ''}`
      : `Applying: ${activeChild.applyingGrade || 'Kindergarten'}`;

    const rollText =
      isEnrolled && activeChild.rollNumber
        ? activeChild.rollNumber.startsWith('Roll') || activeChild.rollNumber.startsWith('#')
          ? activeChild.rollNumber
          : `#${activeChild.rollNumber}`
        : null;

    const admAyText = isEnrolled
      ? `Adm:  ${activeChild.admissionNumber}  ·   AY ${activeChild.academicYear || '2026–27'}  ·`
      : `App:  ${activeChild.applicationNumber}  ·   AY ${activeChild.academicYear || '2026–27'}  ·`;

    const houseName = isEnrolled ? activeChild.houseName : null;

    return (
      <View style={styles.cardContainer}>
        {/* Top Section: Avatar + Details + Circular Dropdown Chevron */}
        <View style={styles.topRow}>
          {/* Avatar with Status Check Badge */}
          <View style={styles.avatarWrapper}>
            {activeChild.avatarUrl && !mainAvatarError ? (
              <Image
                source={{ uri: activeChild.avatarUrl }}
                style={styles.studentAvatarImage}
                onError={() => setMainAvatarError(true)}
              />
            ) : (
              <Avatar name={activeChild.fullName} size="xl" />
            )}
            <View
              style={[
                styles.statusCheckBadge,
                {
                  backgroundColor: isEnrolled
                    ? DESIGN_TOKENS.colors.emerald
                    : DESIGN_TOKENS.colors.amber,
                },
              ]}
            >
              <Ionicons name="checkmark" size={11} color="#FFFFFF" />
            </View>
          </View>

          {/* Student Credentials */}
          <View style={styles.detailsColumn}>
            {/* Student Full Name */}
            <Text style={styles.studentName} numberOfLines={1}>
              {activeChild.fullName}
            </Text>

            {/* Status Pill: e.g. • ENROLLED */}
            <View
              style={[
                styles.statusBadge,
                isEnrolled ? styles.statusBadgeEnrolled : styles.statusBadgeApplicant,
              ]}
            >
              <View
                style={[
                  styles.statusDot,
                  {
                    backgroundColor: isEnrolled
                      ? DESIGN_TOKENS.colors.emerald
                      : DESIGN_TOKENS.colors.amber,
                  },
                ]}
              />
              <Text
                style={[
                  styles.statusBadgeText,
                  isEnrolled ? styles.statusBadgeTextEnrolled : styles.statusBadgeTextApplicant,
                ]}
              >
                {statusLabel}
              </Text>
            </View>

            {/* Grade, Section · Roll #R-11 */}
            <View style={styles.subtextRow}>
              <Text style={styles.studentSubtext}>{gradeSectionText}</Text>
              {rollText ? (
                <View style={styles.rollRow}>
                  <Text style={styles.bulletSeparator}>·</Text>
                  <Text style={styles.rollLabelText}>Roll </Text>
                  <Text style={styles.rollValueText}>{rollText}</Text>
                </View>
              ) : null}
            </View>

            {/* Admission No · Academic Year */}
            <Text style={styles.admAyText} numberOfLines={1}>
              {admAyText}
            </Text>

            {/* Student House (if present) */}
            {houseName ? (
              <Text style={styles.houseText} numberOfLines={1}>
                {houseName}
              </Text>
            ) : null}
          </View>

          {/* Top Right Circular Dropdown Chevron Button */}
          {canSwitch && (
            <TouchableOpacity
              onPress={onOpenSwitcher}
              activeOpacity={0.75}
              style={styles.dropdownChevronButton}
              accessibilityRole="button"
              accessibilityLabel="Switch student profile"
            >
              <Ionicons name="chevron-down" size={18} color="#1E293B" />
            </TouchableOpacity>
          )}
        </View>

        {/* Thin Horizontal Divider */}
        <View style={styles.horizontalDivider} />

        {/* Bottom CHILDREN Switcher Bar */}
        <View style={styles.childrenBar}>
          <Text style={styles.childrenLabel}>CHILDREN</Text>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.childrenChipsContainer}
          >
            {children.map((c) => {
              const isSelected = c.id === activeChild.id;
              const shortGrade = formatShortGrade(
                c.kind === 'enrolled' ? c.gradeLevel : c.applyingGrade,
              );
              const firstName = c.firstName || c.fullName.split(' ')[0];

              return (
                <TouchableOpacity
                  key={c.id}
                  onPress={() => useChildStore.getState().selectChild(c.id)}
                  style={[styles.childChip, isSelected && styles.childChipActive]}
                  activeOpacity={0.8}
                  accessibilityRole="button"
                  accessibilityState={{ selected: isSelected }}
                  accessibilityLabel={`Select ${c.fullName}`}
                >
                  {/* Thumbnail Avatar */}
                  <View style={styles.chipAvatarContainer}>
                    <ChildChipAvatar uri={c.avatarUrl} name={firstName} />
                  </View>

                  {/* Child Name & Grade */}
                  <View style={styles.chipTextColumn}>
                    <Text
                      style={[styles.chipNameText, isSelected && styles.chipNameTextActive]}
                      numberOfLines={1}
                    >
                      {firstName}
                    </Text>
                    <Text
                      style={[styles.chipGradeText, isSelected && styles.chipGradeTextActive]}
                      numberOfLines={1}
                    >
                      ({shortGrade})
                    </Text>
                  </View>

                  {/* Green dot for active child */}
                  {isSelected && <View style={styles.chipActiveDot} />}
                </TouchableOpacity>
              );
            })}

            {/* Ellipsis (...) button to open full switcher sheet */}
            {canSwitch && (
              <TouchableOpacity
                onPress={onOpenSwitcher}
                style={styles.moreEllipsisButton}
                activeOpacity={0.75}
                accessibilityRole="button"
                accessibilityLabel="More student profiles"
              >
                <Ionicons
                  name="ellipsis-horizontal"
                  size={16}
                  color={DESIGN_TOKENS.colors.protoIndigo}
                />
              </TouchableOpacity>
            )}
          </ScrollView>
        </View>
      </View>
    );
  },
);

SelectedChildCard.displayName = 'SelectedChildCard';

const styles = StyleSheet.create({
  cardContainer: {
    backgroundColor: '#FFFFFF',
    borderColor: '#E2E8F0',
    borderWidth: 1,
    borderRadius: 24,
    padding: 16,
    marginBottom: 16,
    ...DESIGN_TOKENS.shadows.floating,
  },
  topRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
  },
  contentRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
  },
  avatarWrapper: {
    position: 'relative',
    width: 64,
    height: 64,
  },
  studentAvatarImage: {
    width: 64,
    height: 64,
    borderRadius: 32,
    borderWidth: 2,
    borderColor: 'rgba(67, 56, 202, 0.15)',
  },
  statusCheckBadge: {
    position: 'absolute',
    bottom: -1,
    right: -1,
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 2,
    borderColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyAvatarCircle: {
    width: 54,
    height: 54,
    borderRadius: 27,
    backgroundColor: '#EEF2FF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  detailsColumn: {
    flex: 1,
    minWidth: 0,
  },
  studentName: {
    fontSize: 19,
    fontWeight: '800',
    color: DESIGN_TOKENS.colors.deepNavy,
    letterSpacing: -0.3,
    lineHeight: 23,
  },
  studentSubtext: {
    fontSize: 13,
    fontWeight: '500',
    color: DESIGN_TOKENS.colors.textSecondary,
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 2.5,
    borderRadius: 12,
    alignSelf: 'flex-start',
    marginTop: 4,
    marginBottom: 4,
  },
  statusBadgeEnrolled: {
    backgroundColor: '#ECFDF5',
  },
  statusBadgeApplicant: {
    backgroundColor: '#FFFBEB',
  },
  statusDot: {
    width: 5,
    height: 5,
    borderRadius: 2.5,
  },
  statusBadgeText: {
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  statusBadgeTextEnrolled: {
    color: '#065F46',
  },
  statusBadgeTextApplicant: {
    color: '#92400E',
  },
  subtextRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    marginTop: 1,
  },
  rollRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  bulletSeparator: {
    color: '#94A3B8',
    fontSize: 13,
    marginHorizontal: 4,
  },
  rollLabelText: {
    fontSize: 13,
    fontWeight: '700',
    color: DESIGN_TOKENS.colors.protoIndigo,
  },
  rollValueText: {
    fontSize: 13,
    fontWeight: '800',
    color: DESIGN_TOKENS.colors.protoIndigo,
  },
  admAyText: {
    fontSize: 12,
    fontWeight: '500',
    color: '#64748B',
    marginTop: 3,
  },
  houseText: {
    fontSize: 13,
    fontWeight: '600',
    color: DESIGN_TOKENS.colors.protoIndigo,
    marginTop: 3,
  },
  dropdownChevronButton: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    alignItems: 'center',
    justifyContent: 'center',
  },
  horizontalDivider: {
    height: 1,
    backgroundColor: '#F1F5F9',
    marginTop: 14,
    marginBottom: 12,
  },
  childrenBar: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  childrenLabel: {
    fontSize: 11,
    fontWeight: '800',
    color: '#64748B',
    letterSpacing: 0.6,
  },
  childrenChipsContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  childChip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F1F5F9',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: 20,
    paddingVertical: 4,
    paddingHorizontal: 8,
    gap: 6,
  },
  childChipActive: {
    backgroundColor: DESIGN_TOKENS.colors.protoIndigo,
    borderColor: DESIGN_TOKENS.colors.protoIndigo,
  },
  chipAvatarContainer: {
    width: 26,
    height: 26,
    borderRadius: 13,
    overflow: 'hidden',
  },
  chipAvatarImage: {
    width: 26,
    height: 26,
    borderRadius: 13,
  },
  chipAvatarFallback: {
    width: 26,
    height: 26,
    borderRadius: 13,
    backgroundColor: '#CBD5E1',
    alignItems: 'center',
    justifyContent: 'center',
  },
  chipAvatarFallbackText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#1E293B',
  },
  chipTextColumn: {
    alignItems: 'flex-start',
  },
  chipNameText: {
    fontSize: 11,
    fontWeight: '700',
    color: DESIGN_TOKENS.colors.deepNavy,
  },
  chipNameTextActive: {
    color: '#FFFFFF',
  },
  chipGradeText: {
    fontSize: 9.5,
    fontWeight: '600',
    color: '#64748B',
  },
  chipGradeTextActive: {
    color: '#E0E7FF',
  },
  chipActiveDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#22C55E',
    marginLeft: 2,
    marginRight: 2,
  },
  moreEllipsisButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#F1F5F9',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    alignItems: 'center',
    justifyContent: 'center',
  },
  switchButtonSmall: {
    backgroundColor: DESIGN_TOKENS.colors.royalIndigo,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 12,
  },
  switchButtonSmallText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#FFFFFF',
  },
});
