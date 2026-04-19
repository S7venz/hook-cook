export function Button({
  variant = 'primary',
  size = 'md',
  full = false,
  type = 'button',
  children,
  onClick,
  disabled,
  ...rest
}) {
  const className = ['btn', `btn-${variant}`, size !== 'md' && `btn-${size}`]
    .filter(Boolean)
    .join(' ');

  const style = full ? { width: '100%', justifyContent: 'center' } : undefined;

  return (
    <button
      type={type}
      className={className}
      style={style}
      onClick={onClick}
      disabled={disabled}
      {...rest}
    >
      {children}
    </button>
  );
}
