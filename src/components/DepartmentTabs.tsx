interface DepartmentTabsProps {
  departments: { id: string; name: string }[];
  activeDepartment: string | null;
  onSelect: (id: string | null) => void;
}

const DepartmentTabs = ({ departments, activeDepartment, onSelect }: DepartmentTabsProps) => {
  return (
    <div className="flex flex-wrap gap-2">
      <button
        onClick={() => onSelect(null)}
        className={`dept-tab ${activeDepartment === null ? "dept-tab-active" : "dept-tab-inactive"}`}
      >
        All Departments
      </button>
      {departments.map((dept) => (
        <button
          key={dept.id}
          onClick={() => onSelect(dept.id)}
          className={`dept-tab ${activeDepartment === dept.id ? "dept-tab-active" : "dept-tab-inactive"}`}
        >
          {dept.name}
        </button>
      ))}
    </div>
  );
};

export default DepartmentTabs;
