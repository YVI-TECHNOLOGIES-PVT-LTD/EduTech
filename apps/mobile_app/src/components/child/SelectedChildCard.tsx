import React from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useChildStore } from '../../stores/child.store';
import { Avatar } from '../ui/atoms/Avatar';
import { Badge } from '../ui/atoms/Badge';
import { DESIGN_TOKENS } from '../../theme/tokens/designTokens';

export interface SelectedChildCardProps {
  onOpenSwitcher?: () => void;
  showSwitchButton?: boolean;
}

export const SelectedChildCard: React.FC<SelectedChildCardProps> = ({
  onOpenSwitcher,
  showSwitchButton = true,
}) => {
  const activeChild = useChildStore((s) => s.getSelectedChild());
  const children = useChildStore((s) => s.children);
  const canSwitch = showSwitchButton && Boolean(onOpenSwitcher);

  if (!activeChild) {
    return (
      <View
        style={{
          backgroundColor: DESIGN_TOKENS.colors.surface,
          borderColor: DESIGN_TOKENS.colors.border,
          borderWidth: 1,
          borderRadius: DESIGN_TOKENS.radius.card,
          padding: DESIGN_TOKENS.spacing.standard,
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'space-between',
          marginBottom: DESIGN_TOKENS.spacing.standard,
          ...DESIGN_TOKENS.shadows.subtle,
        }}
      >
        <View style={{ flexDirection: 'row', alignItems: 'center', flex: 1, marginRight: 12 }}>
          <View
            style={{
              width: 44,
              height: 44,
              borderRadius: 22,
              backgroundColor: DESIGN_TOKENS.colors.primaryLight,
              alignItems: 'center',
              justifyContent: 'center',
              marginRight: 12,
            }}
          >
            <Ionicons name="people-outline" size={22} color={DESIGN_TOKENS.colors.primary} />
          </View>
          <View style={{ flex: 1 }}>
            <Text
              style={{
                fontSize: 14,
                fontWeight: '800',
                color: DESIGN_TOKENS.colors.textPrimary,
                marginBottom: 2,
              }}
            >
              No Student Selected
            </Text>
            <Text
              style={{
                fontSize: 12,
                color: DESIGN_TOKENS.colors.textSecondary,
              }}
            >
              Select or link a child profile
            </Text>
          </View>
        </View>
        {onOpenSwitcher && (
          <TouchableOpacity
            onPress={onOpenSwitcher}
            activeOpacity={0.8}
            style={{
              backgroundColor: DESIGN_TOKENS.colors.primary,
              paddingHorizontal: 14,
              paddingVertical: 8,
              borderRadius: DESIGN_TOKENS.radius.button,
            }}
            accessibilityRole="button"
            accessibilityLabel="Select student"
          >
            <Text style={{ fontSize: 12, fontWeight: '700', color: '#FFFFFF' }}>Select</Text>
          </TouchableOpacity>
        )}
      </View>
    );
  }

  const isEnrolled = activeChild.kind === 'enrolled';

  return (
    <TouchableOpacity
      activeOpacity={canSwitch ? 0.8 : 1}
      onPress={canSwitch ? onOpenSwitcher : undefined}
      style={{
        backgroundColor: DESIGN_TOKENS.colors.surface,
        borderColor: DESIGN_TOKENS.colors.border,
        borderWidth: 1,
        borderRadius: DESIGN_TOKENS.radius.card,
        padding: DESIGN_TOKENS.spacing.standard,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginBottom: DESIGN_TOKENS.spacing.standard,
        ...DESIGN_TOKENS.shadows.subtle,
      }}
      accessibilityRole={canSwitch ? 'button' : 'summary'}
      accessibilityLabel={`Selected student ${activeChild.fullName}`}
      accessibilityHint={canSwitch ? 'Double tap to open student selector' : undefined}
    >
      <View style={{ flexDirection: 'row', alignItems: 'center', flex: 1, marginRight: 8 }}>
        <Avatar name={activeChild.fullName} uri={activeChild.avatarUrl} size="md" />
        <View style={{ marginLeft: 12, flex: 1 }}>
          <View
            style={{
              flexDirection: 'row',
              alignItems: 'center',
              flexWrap: 'wrap',
              gap: 6,
              marginBottom: 3,
            }}
          >
            <Text
              style={{
                fontSize: 15,
                fontWeight: '900',
                color: DESIGN_TOKENS.colors.textPrimary,
                letterSpacing: -0.2,
              }}
              numberOfLines={1}
            >
              {activeChild.fullName}
            </Text>
            <Badge
              label={isEnrolled ? 'Enrolled' : 'Applicant'}
              variant={isEnrolled ? 'primary' : 'warning'}
            />
          </View>

          <Text
            style={{
              fontSize: 12,
              fontWeight: '500',
              color: DESIGN_TOKENS.colors.textSecondary,
              lineHeight: 16,
            }}
            numberOfLines={1}
          >
            {isEnrolled
              ? `Grade ${activeChild.gradeLevel} • Sec ${activeChild.section}${
                  activeChild.rollNumber ? ` • Roll #${activeChild.rollNumber}` : ''
                }`
              : `Applying: ${activeChild.applyingGrade} • ${activeChild.applicationNumber}`}
          </Text>
        </View>
      </View>

      {canSwitch && (
        <View
          style={{
            flexDirection: 'row',
            alignItems: 'center',
            backgroundColor: DESIGN_TOKENS.colors.primaryLight,
            paddingHorizontal: 10,
            paddingVertical: 6,
            borderRadius: DESIGN_TOKENS.radius.small,
          }}
        >
          <Text
            style={{
              fontSize: 11,
              fontWeight: '800',
              color: DESIGN_TOKENS.colors.primary,
              marginRight: 4,
            }}
          >
            Switch
          </Text>
          <Ionicons name="chevron-down" size={13} color={DESIGN_TOKENS.colors.primary} />
        </View>
      )}
    </TouchableOpacity>
  );
};
