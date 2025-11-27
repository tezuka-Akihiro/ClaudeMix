// GroupHeader - app/components
// グループ名（"app/components"）を表示

export interface GroupHeaderProps {
  /** グループ名 */
  name: string;
}

/**
 * グループヘッダーコンポーネント
 *
 * - グループ名を表示（固定: "app/components"）
 * - monospaceフォント、cyan-400色
 *
 * @example
 * <GroupHeader name="app/components" />
 */
export default function GroupHeader({ name }: GroupHeaderProps) {
  return <div data-testid="group-header" className="group-header">
    {name}
  </div>;
}
