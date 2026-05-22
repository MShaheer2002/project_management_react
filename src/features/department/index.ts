export { DepartmentsPage } from './pages/DepartmentsPage';
export { DepartmentDetailPage } from './pages/DepartmentDetailPage';
export {
  departmentQueryKeys,
  useAddDepartmentMembers,
  useCreateDepartment,
  useDeleteDepartment,
  useDepartmentDetail,
  useDepartmentMembers,
  useDepartmentOptions,
  useDepartmentsDirectory,
  useRemoveDepartmentMember,
  useUpdateDepartment,
} from './hooks/useDepartmentData';
export type {
  AddDepartmentMembersInput,
  CreateDepartmentInput,
  DepartmentCompact,
  DepartmentDetail,
  DepartmentListResult,
  DepartmentMemberOption,
  DepartmentMemberRow,
  DepartmentMemberSort,
  DepartmentSort,
  DepartmentSummary,
  DepartmentVisibility,
  ListDepartmentMembersInput,
  ListDepartmentsInput,
  UpdateDepartmentInput,
} from './types';
