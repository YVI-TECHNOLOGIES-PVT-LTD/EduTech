import { DraftStorage } from '../../src/storage/draft-storage';
import AsyncStorage from '@react-native-async-storage/async-storage';

jest.mock('@react-native-async-storage/async-storage', () => ({
  getItem: jest.fn(),
  setItem: jest.fn(),
  removeItem: jest.fn(),
  getAllKeys: jest.fn(),
  multiRemove: jest.fn(),
}));

describe('DraftStorage Service (AsyncStorage)', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should save and load non-sensitive form draft', async () => {
    const draftData = { student_first_name: 'Alex', grade_id: 'grd_1' };
    (AsyncStorage.getItem as jest.Mock).mockResolvedValueOnce(JSON.stringify(draftData));

    await DraftStorage.saveDraft('usr_1', draftData, 'app_123');
    expect(AsyncStorage.setItem).toHaveBeenCalledWith(
      'edutrack_app_draft_usr_1_app_123',
      JSON.stringify(draftData),
    );

    const loaded = await DraftStorage.getDraft('usr_1', 'app_123');
    expect(loaded).toEqual(draftData);
  });

  it('should clear specific application draft', async () => {
    await DraftStorage.clearDraft('usr_1', 'app_123');
    expect(AsyncStorage.removeItem).toHaveBeenCalledWith('edutrack_app_draft_usr_1_app_123');
  });

  it('should clear all drafts for a user', async () => {
    (AsyncStorage.getAllKeys as jest.Mock).mockResolvedValueOnce([
      'edutrack_app_draft_usr_1_app_1',
      'edutrack_app_draft_usr_1_app_2',
      'edutrack_app_draft_usr_2_app_1',
    ]);

    await DraftStorage.clearAllDraftsForUser('usr_1');
    expect(AsyncStorage.multiRemove).toHaveBeenCalledWith([
      'edutrack_app_draft_usr_1_app_1',
      'edutrack_app_draft_usr_1_app_2',
    ]);
  });
});
