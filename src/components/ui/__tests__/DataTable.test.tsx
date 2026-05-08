import { render, screen } from '@testing-library/react';
import { DataTable } from '../DataTable';

const mockData = [
  { id: '1', name: 'Alice', age: 30, city: 'Paris' },
  { id: '2', name: 'Bob', age: 25, city: 'Lyon' },
  { id: '3', name: 'Charlie', age: 35, city: 'Marseille' },
];

const columns = [
  { key: 'name', label: 'Name' },
  { key: 'age', label: 'Age', sortable: true },
  { key: 'city', label: 'City' },
];

describe('DataTable', () => {
  it('renders column headers', () => {
    render(<DataTable columns={columns} data={mockData} />);
    expect(screen.getByText('Name')).toBeInTheDocument();
    expect(screen.getByText('Age')).toBeInTheDocument();
    expect(screen.getByText('City')).toBeInTheDocument();
  });

  it('renders data rows', () => {
    render(<DataTable columns={columns} data={mockData} />);
    expect(screen.getByText('Alice')).toBeInTheDocument();
    expect(screen.getByText('Bob')).toBeInTheDocument();
    expect(screen.getByText('Charlie')).toBeInTheDocument();
  });

  it('shows empty message when no data', () => {
    render(<DataTable columns={columns} data={[]} emptyMessage="No data found" />);
    expect(screen.getByText('No data found')).toBeInTheDocument();
  });

  it('renders custom cell content with render function', () => {
    const customColumns = [
      { key: 'name', label: 'Name', render: (item: typeof mockData[0]) => `User: ${item.name}` },
    ];
    render(<DataTable columns={customColumns} data={mockData} />);
    expect(screen.getByText('User: Alice')).toBeInTheDocument();
    expect(screen.getByText('User: Bob')).toBeInTheDocument();
  });

  it('shows sort icons for sortable columns', () => {
    render(<DataTable columns={columns} data={mockData} />);
    const ageHeader = screen.getByText('Age');
    expect(ageHeader.closest('th')).not.toBeNull();
  });

  it('calls onRowClick when row is clicked', () => {
    const handleClick = vi.fn();
    render(<DataTable columns={columns} data={mockData} onRowClick={handleClick} />);
    const row = screen.getByText('Alice').closest('tr');
    expect(row).not.toBeNull();
    expect(row).toHaveClass('cursor-pointer');
  });
});
