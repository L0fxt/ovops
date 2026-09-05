import React from 'react';
import { Monitor, Wrench, BarChart3, Settings } from 'lucide-react';

export type UserRole = 'OPERATOR' | 'TECHNICIAN' | 'SUPERVISOR' | 'ADMIN';

interface RoleSwitcherProps {
  currentRole: UserRole;
  onRoleChange: (role: UserRole) => void;
  onOpenSettings: () => void;
}

export const RoleSwitcher: React.FC<RoleSwitcherProps> = ({
  currentRole,
  onRoleChange,
  onOpenSettings
}) => {
  const roles = [
    { id: 'OPERATOR' as UserRole, label: '中控调度员', icon: Monitor, badge: '实时大屏' },
    { id: 'TECHNICIAN' as UserRole, label: '现场维保技师', icon: Wrench, badge: '防爆移动端' },
    { id: 'SUPERVISOR' as UserRole, label: '维保主管/厂长', icon: BarChart3, badge: '决策Kanban' },
  ];

  return (
    <div className="flex items-center gap-1.5 p-1 rounded-lg bg-zinc-100 dark:bg-zinc-900 border border-zinc-200 dark:border-white/10 overflow-x-auto flex-shrink-0">
      <span className="text-xs text-zinc-500 dark:text-zinc-400 px-2 font-medium whitespace-nowrap flex-shrink-0 hidden xl:inline">
        角色门户:
      </span>

      {roles.map((r) => {
        const Icon = r.icon;
        const isActive = currentRole === r.id;
        return (
          <button
            key={r.id}
            onClick={() => onRoleChange(r.id)}
            className={`px-2.5 py-1 text-xs font-medium rounded-md transition-all whitespace-nowrap flex-shrink-0 flex items-center gap-1.5 ${
              isActive
                ? 'bg-blue-600 text-white shadow-sm font-semibold'
                : 'text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-200 hover:bg-zinc-200/60 dark:hover:bg-zinc-800/60'
            }`}
          >
            <Icon className="w-3.5 h-3.5" strokeWidth={1.5} />
            <span>{r.label}</span>
          </button>
        );
      })}

      {/* 后台设置快捷按钮 */}
      <button
        onClick={onOpenSettings}
        title="系统与算法后台配置 (大模型/飞书/钉钉)"
        className="px-2.5 py-1 text-xs font-medium rounded-md text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-200 hover:bg-zinc-200/60 dark:hover:bg-zinc-800/60 transition-all whitespace-nowrap flex-shrink-0 flex items-center gap-1"
      >
        <Settings className="w-3.5 h-3.5 text-zinc-500" strokeWidth={1.5} />
        <span className="hidden sm:inline">系统后台</span>
      </button>
    </div>
  );
};
