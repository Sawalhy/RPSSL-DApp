interface AddressInputProps {
  id: string;
  label: string;
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
}

export const AddressInput = ({ 
  id, 
  label, 
  value, 
  onChange, 
  placeholder = "0x..." 
}: AddressInputProps) => {
  return (
    <div style={{ marginBottom: '10px' }}>
      <label htmlFor={id}>{label}:</label>
      <input
        id={id}
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        style={{
          marginLeft: '10px',
          padding: '5px',
          width: '300px',
          fontFamily: 'monospace'
        }}
      />
    </div>
  );
};
