// hooks/useBranch.ts
import { useEffect, useCallback } from 'react';
import { useSession } from 'next-auth/react';
import { useBranchStore } from '@/shared/store/useBranchStore';
import {
  branchService,
  branchSettingsService,
  organizationService,
  userBranchService,
} from '@/services/firebase/branchServices';
import { Branch, BranchSettings } from '@/modelTypes/branch';
import { Organization } from '@/modelTypes/organization';

export const useBranch = () => {
  const { data: session } = useSession();
  const {
    currentBranch,
    currentBranchSettings,
    currentOrganization,
    userBranches,
    availableBranches,
    isLoading,
    isLoadingSettings,
    setCurrentBranch,
    setCurrentBranchSettings,
    setCurrentOrganization,
    setUserBranches,
    setAvailableBranches,
    setLoading,
    setLoadingSettings,
    clearState,
    getCurrentBranchId,
    getCurrentOrganizationId,
    hasMultipleBranches,
    getCurrentUserRole,
    canAccessBranch,
    getCurrency,
    getTaxRate,
    getServiceChargeRate,
    isTipEnabled,
    getTipSuggestions,
  } = useBranchStore();

  // Initialize branches when user logs in
  const initializeBranches = useCallback(async () => {
    if (!session?.user?.id) return;

    setLoading(true);
    try {
      // Get user's branches
      const userBranchesData = await userBranchService.getByUserId(
        session.user.id,
      );
      setUserBranches(userBranchesData);

      if (userBranchesData.length === 0) {
        // User has no branches - might need to create default organization/branch
        setLoading(false);
        return;
      }

      // Get available branches
      const branchPromises = userBranchesData.map((ub) =>
        branchService.getById(ub.branchId),
      );
      const branches = (await Promise.all(branchPromises)).filter(
        Boolean,
      ) as Branch[];
      setAvailableBranches(branches);

      // Set current branch (default or first available)
      const defaultUserBranch = userBranchesData.find((ub) => ub.isDefault);
      const targetBranchId =
        defaultUserBranch?.branchId || userBranchesData[0]?.branchId;
      const targetBranch = branches.find((b) => b.id === targetBranchId);

      if (targetBranch) {
        setCurrentBranch(targetBranch);

        // Load organization
        const organization = await organizationService.getById(
          targetBranch.organizationId,
        );
        if (organization) {
          setCurrentOrganization(organization);
        }

        // Load branch settings
        await loadBranchSettings(targetBranch.id);
      }
    } catch (error) {
      console.error('Error initializing branches:', error);
    } finally {
      setLoading(false);
    }
  }, [session?.user?.id]);

  // Load branch settings
  const loadBranchSettings = useCallback(
    async (branchId: string) => {
      setLoadingSettings(true);
      try {
        let settings = await branchSettingsService.getByBranchId(branchId);

        // Create default settings if none exist
        if (!settings && session?.user?.id) {
          settings = await branchSettingsService.createDefault(
            branchId,
            session.user.id,
          );
        }

        if (settings) {
          setCurrentBranchSettings(settings);
        }
      } catch (error) {
        console.error('Error loading branch settings:', error);
      } finally {
        setLoadingSettings(false);
      }
    },
    [session?.user?.id],
  );

  // Switch to different branch
  const switchBranch = useCallback(
    async (branchId: string) => {
      if (!canAccessBranch(branchId)) {
        throw new Error('Access denied to this branch');
      }

      const branch = availableBranches.find((b) => b.id === branchId);
      if (!branch) {
        throw new Error('Branch not found');
      }

      setLoading(true);
      try {
        // Set as current branch
        setCurrentBranch(branch);

        // Load organization if different
        if (branch.organizationId !== getCurrentOrganizationId()) {
          const organization = await organizationService.getById(
            branch.organizationId,
          );
          if (organization) {
            setCurrentOrganization(organization);
          }
        }

        // Load branch settings
        await loadBranchSettings(branch.id);

        // Optionally set as default for user
        if (session?.user?.id) {
          await userBranchService.setDefaultBranch(session.user.id, branchId);
        }
      } catch (error) {
        console.error('Error switching branch:', error);
        throw error;
      } finally {
        setLoading(false);
      }
    },
    [
      availableBranches,
      canAccessBranch,
      getCurrentOrganizationId,
      session?.user?.id,
    ],
  );

  // Update branch settings
  const updateBranchSettings = useCallback(
    async (updates: Partial<BranchSettings>) => {
      if (!currentBranch?.id || !session?.user?.id) return;

      try {
        await branchSettingsService.update(
          currentBranch.id,
          updates,
          session.user.id,
        );

        // Reload settings
        await loadBranchSettings(currentBranch.id);
      } catch (error) {
        console.error('Error updating branch settings:', error);
        throw error;
      }
    },
    [currentBranch?.id, session?.user?.id, loadBranchSettings],
  );

  // Create new branch
  const createBranch = useCallback(
    async (branchData: Omit<Branch, 'id'>) => {
      if (!session?.user?.id || !currentOrganization) return;

      try {
        const newBranch = await branchService.create({
          ...branchData,
          createdBy: session.user.id,
        });

        // Create default settings
        await branchSettingsService.createDefault(
          newBranch.id,
          session.user.id,
        );

        // Add user to branch with admin permissions
        await userBranchService.addUserToBranch({
          userId: session.user.id,
          branchId: newBranch.id,
          organizationId: currentOrganization.id,
          role: 'admin' as any,
          permissions: {
            canManageSettings: true,
            canViewReports: true,
            canManageInventory: true,
            canManageUsers: true,
            canProcessOrders: true,
            canProcessPayments: true,
            canManageCustomers: true,
            canManageSuppliers: true,
          },
          isActive: true,
          isDefault: false,
          createdAt: new Date(),
          updatedAt: new Date(),
        });

        // Refresh user branches
        await initializeBranches();

        return newBranch;
      } catch (error) {
        console.error('Error creating branch:', error);
        throw error;
      }
    },
    [session?.user?.id, currentOrganization, initializeBranches],
  );

  // Initialize on mount and when user changes
  useEffect(() => {
    if (session?.user?.id) {
      initializeBranches();
    } else {
      clearState();
    }
  }, [session?.user?.id, initializeBranches, clearState]);

  return {
    // State
    currentBranch,
    currentBranchSettings,
    currentOrganization,
    userBranches,
    availableBranches,
    isLoading,
    isLoadingSettings,

    // Methods
    switchBranch,
    updateBranchSettings,
    createBranch,
    initializeBranches,

    // Utilities
    getCurrentBranchId,
    getCurrentOrganizationId,
    hasMultipleBranches,
    getCurrentUserRole,
    canAccessBranch,

    // Settings shortcuts
    getCurrency,
    getTaxRate,
    getServiceChargeRate,
    isTipEnabled,
    getTipSuggestions,
  };
};
