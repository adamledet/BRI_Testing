import { useState, useEffect } from 'react';
import { DeleteMember, GetAllMembers } from '../api/memberService';
import CreateMemberModal from './CreateMemberModal';

export default function MemberList({ refreshTrigger, onSelectMember }) {
  const [members, setMembers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  
  // Modal & Selection State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [internalRefresh, setInternalRefresh] = useState(0);
  const [selectedMemberIds, setSelectedMemberIds] = useState([]);

  // Search & Filter State
  const [searchQuery, setSearchQuery] = useState('');
  const [showAdvancedFilters, setShowAdvancedFilters] = useState(false);
  const [showColumnConfig, setShowColumnConfig] = useState(false);

  // Sorting State
  const [sortConfig, setSortConfig] = useState({ key: 'lastName', dir: 'asc' });

  // Column Visibility State
  const [visibleColumns, setVisibleColumns] = useState({
    name: true,
    firstName: false,
    lastName: false,
    employer: true
  });

  // Pagination State
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [jumpInput, setJumpInput] = useState('');
  
  // Pagination Window Shift State (tracks the starting page number of the 5-page block)
  const [windowStart, setWindowStart] = useState(1);

  const triggerRefresh = () => {
    setInternalRefresh(prev => prev + 1);
    if (refreshTrigger) refreshTrigger();
  };

  useEffect(() => {
    async function loadMembers() {
      setLoading(true);
      try {
        const data = await GetAllMembers();
        setMembers(data);
        setError('');
      } catch (err) {
        setError('Failed to load member list.');
      } finally {
        setLoading(false);
      }
    }
    loadMembers();
  }, [refreshTrigger, internalRefresh]);

  // Filter members based on search query
  const filteredMembers = members.filter((member) => {
    const query = searchQuery.toLowerCase();
    const firstName = (member.firstname || member.FirstName || '').toLowerCase();
    const lastName = (member.lastname || member.LastName || '').toLowerCase();
    const employer = (member.employer || member.Employer || '').toLowerCase();

    return firstName.includes(query) || lastName.includes(query) || employer.includes(query);
  });

  // Sort members alphabetically / reverse-alphabetically
  const sortedMembers = [...filteredMembers].sort((a, b) => {
    let valA = '';
    let valB = '';

    if (sortConfig.key === 'name' || sortConfig.key === 'lastName') {
      valA = (a.lastname || a.LastName || '').toLowerCase();
      valB = (b.lastname || b.LastName || '').toLowerCase();
    } else if (sortConfig.key === 'firstName') {
      valA = (a.firstname || a.FirstName || '').toLowerCase();
      valB = (b.firstname || b.FirstName || '').toLowerCase();
    } else if (sortConfig.key === 'employer') {
      valA = (a.employer || a.Employer || '').toLowerCase();
      valB = (b.employer || b.Employer || '').toLowerCase();
    }

    if (valA < valB) return sortConfig.dir === 'asc' ? -1 : 1;
    if (valA > valB) return sortConfig.dir === 'asc' ? 1 : -1;
    return 0;
  });

  // Pagination calculations
  const totalPages = Math.ceil(sortedMembers.length / pageSize) || 1;

  // Reset pagination and window when search query, total pages, or page size changes
  useEffect(() => {
    setCurrentPage(1);
    setWindowStart(1);
  }, [searchQuery, pageSize, totalPages]);

  // Whenever currentPage changes, center it in the 5-page window if possible
  useEffect(() => {
    let newStart = currentPage - 2;
    if (newStart < 1) {
      newStart = 1;
    } else if (newStart > totalPages - 4) {
      newStart = Math.max(1, totalPages - 4);
    }
    setWindowStart(newStart);
  }, [currentPage, totalPages]);

  const paginatedMembers = sortedMembers.slice((currentPage - 1) * pageSize, currentPage * pageSize);

  // Generate exactly 5 page buttons based on windowStart
  const getVisiblePageNumbers = () => {
    const pages = [];
    const end = Math.min(totalPages, windowStart + 4);
    for (let i = windowStart; i <= end; i++) {
      pages.push(i);
    }
    return pages;
  };

  // Shift window forward by 3 pages via "...>" button without changing current page
  const handleShiftForward = () => {
    const newStart = Math.min(totalPages - 4, windowStart + 3);
    setWindowStart(Math.max(1, newStart));
  };

  // Shift window backward by 3 pages via "<..." button without changing current page
  const handleShiftBackward = () => {
    const newStart = Math.max(1, windowStart - 3);
    setWindowStart(newStart);
  };

  // Handle Column Header Click for Sorting
  const handleSort = (key) => {
    setSortConfig(prev => ({
      key,
      dir: prev.key === key && prev.dir === 'asc' ? 'desc' : 'asc'
    }));
  };

  // Render sorting indicator arrow
  const renderSortArrow = (key) => {
    if (sortConfig.key !== key) return <span style={{ color: '#94a3b8', marginLeft: '5px' }}>⇕</span>;
    return <span style={{ color: '#38bdf8', marginLeft: '5px' }}>{sortConfig.dir === 'asc' ? '▲' : '▼'}</span>;
  };

  const handleJumpToPage = (e) => {
    e.preventDefault();
    const pageNum = parseInt(jumpInput, 10);
    if (!isNaN(pageNum) && pageNum >= 1 && pageNum <= totalPages) {
      setCurrentPage(pageNum);
      setJumpInput('');
    } else {
      alert(`Invalid page number. Please enter a number between 1 and ${totalPages}.`);
    }
  };

  const handleSelectAll = (e) => {
    if (e.target.checked) {
      setSelectedMemberIds(sortedMembers.map(m => m.recno));
    } else {
      setSelectedMemberIds([]);
    }
  };

  const handleSelectRow = (recno) => {
    setSelectedMemberIds(prev => 
      prev.includes(recno) ? prev.filter(id => id !== recno) : [...prev, recno]
    );
  };

  const handleBulkDelete = async () => {
    if (window.confirm(`Are you sure you want to delete ${selectedMemberIds.length} selected member(s)?`)) {
      try {
        for (const recno of selectedMemberIds) {
          await DeleteMember(recno);
        }
        setSelectedMemberIds([]);
        triggerRefresh();
      } catch (err) {
        alert("Failed to complete bulk delete.");
      }
    }
  };

  const handleBulkUpdate = () => {
    alert(`Mass Update triggered for ${selectedMemberIds.length} member(s). (Stub action)`);
  };

  const allFilteredSelected = sortedMembers.length > 0 && sortedMembers.every(m => selectedMemberIds.includes(m.recno));

  return (
    <div style={{ width: '100%' }}>
      
      {/* ROW 1: TITLE & PRIMARY ACTION BUTTONS */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '15px', flexWrap: 'wrap', gap: '15px' }}>
        <h1 style={{ color: '#334155', margin: 0, fontSize: '24px', letterSpacing: '0.5px' }}>MEMBERS LIST</h1>
        
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
          <button 
            onClick={() => { setShowColumnConfig(!showColumnConfig); setShowAdvancedFilters(false); }}
            style={{ backgroundColor: showColumnConfig ? '#334155' : '#475569', color: '#fff', border: 'none', padding: '9px 15px', borderRadius: '4px', cursor: 'pointer', fontWeight: 'bold', fontSize: '14px', whiteSpace: 'nowrap' }}
          >
            Columns
          </button>
          <button 
            onClick={() => { setShowAdvancedFilters(!showAdvancedFilters); setShowColumnConfig(false); }}
            style={{ backgroundColor: showAdvancedFilters ? '#334155' : '#475569', color: '#fff', border: 'none', padding: '9px 15px', borderRadius: '4px', cursor: 'pointer', fontWeight: 'bold', fontSize: '14px', whiteSpace: 'nowrap' }}
          >
            {showAdvancedFilters ? 'Hide Filters' : 'Advanced Filters'}
          </button>
          <button 
            onClick={() => setIsModalOpen(true)} 
            style={{ backgroundColor: '#3b82f6', color: '#fff', border: 'none', padding: '9px 18px', borderRadius: '4px', cursor: 'pointer', fontWeight: 'bold', fontSize: '14px', whiteSpace: 'nowrap' }}
          >
            + Add New Member
          </button>
        </div>
      </div>

      {/* ROW 2: SEARCH BAR & RECORD COUNT / BULK ACTIONS */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '15px', flexWrap: 'wrap', gap: '15px' }}>
        <input 
          type="text" 
          placeholder="Search by name or employer..." 
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          style={{ padding: '9px 12px', borderRadius: '4px', border: '1px solid #cbd5e1', width: '100%', maxWidth: '350px', backgroundColor: '#fff', color: '#334155', fontSize: '14px', boxSizing: 'border-box' }}
        />

        <div>
          {selectedMemberIds.length > 0 ? (
            <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
              <span style={{ fontSize: '14px', color: '#334155', fontWeight: 'bold' }}>{selectedMemberIds.length} selected</span>
              <button onClick={handleBulkUpdate} style={{ backgroundColor: '#0284c7', color: '#fff', border: 'none', padding: '8px 15px', borderRadius: '4px', cursor: 'pointer', fontWeight: 'bold', fontSize: '13px' }}>
                Mass Update
              </button>
              <button onClick={handleBulkDelete} style={{ backgroundColor: '#dc2626', color: '#fff', border: 'none', padding: '8px 15px', borderRadius: '4px', cursor: 'pointer', fontWeight: 'bold', fontSize: '13px' }}>
                Delete Selected
              </button>
            </div>
          ) : (
            <span style={{ fontSize: '14px', color: '#64748b' }}>Showing {sortedMembers.length} total record(s)</span>
          )}
        </div>
      </div>

      {/* COLUMN CONFIGURATION PANEL */}
      {showColumnConfig && (
        <div style={{ backgroundColor: '#f8fafc', padding: '15px 20px', borderRadius: '8px', border: '1px solid #cbd5e1', marginBottom: '20px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
            <strong style={{ color: '#334155', fontSize: '14px' }}>Toggle Visible Columns:</strong>
            <button onClick={() => setShowColumnConfig(false)} style={{ background: 'none', border: 'none', color: '#64748b', cursor: 'pointer', fontWeight: 'bold' }}>✕</button>
          </div>
          <div style={{ display: 'flex', gap: '20px', flexWrap: 'wrap' }}>
            <label style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '14px', color: '#334155', cursor: 'pointer' }}>
              <input type="checkbox" checked={visibleColumns.name} onChange={(e) => setVisibleColumns({ ...visibleColumns, name: e.target.checked })} />
              Name (Last, First)
            </label>
            <label style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '14px', color: '#334155', cursor: 'pointer' }}>
              <input type="checkbox" checked={visibleColumns.firstName} onChange={(e) => setVisibleColumns({ ...visibleColumns, firstName: e.target.checked })} />
              First Name
            </label>
            <label style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '14px', color: '#334155', cursor: 'pointer' }}>
              <input type="checkbox" checked={visibleColumns.lastName} onChange={(e) => setVisibleColumns({ ...visibleColumns, lastName: e.target.checked })} />
              Last Name
            </label>
            <label style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '14px', color: '#334155', cursor: 'pointer' }}>
              <input type="checkbox" checked={visibleColumns.employer} onChange={(e) => setVisibleColumns({ ...visibleColumns, employer: e.target.checked })} />
              Employer
            </label>
          </div>
        </div>
      )}

      {/* ADVANCED FILTERS PANEL */}
      {showAdvancedFilters && (
        <div style={{ backgroundColor: '#f8fafc', padding: '15px 20px', borderRadius: '8px', border: '1px solid #cbd5e1', marginBottom: '20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <span style={{ color: '#475569', fontSize: '14px' }}><strong>Filter Criteria:</strong> Macro language and intricate custom rules builder pending integration.</span>
          <button onClick={() => setShowAdvancedFilters(false)} style={{ background: 'none', border: 'none', color: '#64748b', cursor: 'pointer', fontWeight: 'bold' }}>✕</button>
        </div>
      )}

      {loading && <p style={{ color: '#64748b' }}>Loading members...</p>}
      {error && <p style={{ color: 'red' }}>{error}</p>}

      {/* MEMBER TABLE */}
      {!loading && !error && (
        <div style={{ backgroundColor: '#fff', borderRadius: '8px', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)', border: '1px solid #cbd5e1', overflow: 'hidden' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
            <thead>
              <tr style={{ backgroundColor: '#334155', color: '#fff' }}>
                <th style={{ padding: '12px 15px', width: '40px', textAlign: 'center' }}>
                  <input 
                    type="checkbox" 
                    checked={allFilteredSelected} 
                    onChange={handleSelectAll} 
                    style={{ cursor: 'pointer' }}
                  />
                </th>
                {visibleColumns.name && (
                  <th onClick={() => handleSort('name')} style={{ padding: '12px 20px', fontWeight: 'bold', fontSize: '14px', cursor: 'pointer', userSelect: 'none' }}>
                    Name {renderSortArrow('name')}
                  </th>
                )}
                {visibleColumns.firstName && (
                  <th onClick={() => handleSort('firstName')} style={{ padding: '12px 20px', fontWeight: 'bold', fontSize: '14px', cursor: 'pointer', userSelect: 'none' }}>
                    First Name {renderSortArrow('firstName')}
                  </th>
                )}
                {visibleColumns.lastName && (
                  <th onClick={() => handleSort('lastName')} style={{ padding: '12px 20px', fontWeight: 'bold', fontSize: '14px', cursor: 'pointer', userSelect: 'none' }}>
                    Last Name {renderSortArrow('lastName')}
                  </th>
                )}
                {visibleColumns.employer && (
                  <th onClick={() => handleSort('employer')} style={{ padding: '12px 20px', fontWeight: 'bold', fontSize: '14px', cursor: 'pointer', userSelect: 'none' }}>
                    Employer {renderSortArrow('employer')}
                  </th>
                )}
              </tr>
            </thead>
            <tbody>
              {paginatedMembers.length === 0 ? (
                <tr>
                  <td colSpan="5" style={{ padding: '30px', textAlign: 'center', color: '#64748b' }}>
                    No members match your search criteria.
                  </td>
                </tr>
              ) : (
                paginatedMembers.map((member) => {
                  const firstName = member.firstname || member.FirstName || '';
                  const lastName = member.lastname || member.LastName || '';
                  const employer = member.employer || member.Employer || 'None';
                  const isChecked = selectedMemberIds.includes(member.recno);

                  return (
                    <tr key={member.recno || member.memberid} style={{ borderBottom: '1px solid #cbd5e1', backgroundColor: isChecked ? '#f8fafc' : '#fff' }}>
                      <td style={{ padding: '15px', textAlign: 'center' }}>
                        <input 
                          type="checkbox" 
                          checked={isChecked} 
                          onChange={() => handleSelectRow(member.recno)} 
                          style={{ cursor: 'pointer' }}
                        />
                      </td>
                      {visibleColumns.name && (
                        <td style={{ padding: '15px 20px' }}>
                          <button 
                            onClick={() => onSelectMember(member)} 
                            style={{ background: 'none', border: 'none', color: '#3b82f6', textDecoration: 'underline', cursor: 'pointer', padding: 0, fontSize: '14px', fontWeight: '500' }}
                          >
                            {lastName}, {firstName}
                          </button>
                        </td>
                      )}
                      {visibleColumns.firstName && (
                        <td style={{ padding: '15px 20px', color: '#334155', fontSize: '14px' }}>{firstName}</td>
                      )}
                      {visibleColumns.lastName && (
                        <td style={{ padding: '15px 20px', color: '#334155', fontSize: '14px' }}>{lastName}</td>
                      )}
                      {visibleColumns.employer && (
                        <td style={{ padding: '15px 20px', color: '#334155', fontSize: '14px' }}>{employer}</td>
                      )}
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>

          {/* PAGINATION FOOTER BAR */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px 20px', backgroundColor: '#f8fafc', borderTop: '1px solid #cbd5e1', flexWrap: 'wrap', gap: '15px' }}>
            
            {/* Rows Per Page */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '13px', color: '#475569' }}>
              <span>Rows per page:</span>
              <select 
                value={pageSize} 
                onChange={(e) => setPageSize(Number(e.target.value))}
                style={{ padding: '4px 8px', borderRadius: '4px', border: '1px solid #cbd5e1', backgroundColor: '#fff', color: '#334155' }}
              >
                <option value={10}>10</option>
                <option value={25}>25</option>
                <option value={50}>50</option>
                <option value={100}>100</option>
              </select>
            </div>

            {/* Center / Numbered Page Buttons & Shift Ellipsis Controls */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flexWrap: 'wrap' }}>
              <button 
                onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                disabled={currentPage === 1}
                style={{ padding: '5px 10px', borderRadius: '4px', border: '1px solid #cbd5e1', backgroundColor: currentPage === 1 ? '#f1f5f9' : '#fff', color: currentPage === 1 ? '#94a3b8' : '#334155', cursor: currentPage === 1 ? 'not-allowed' : 'pointer', fontWeight: 'bold', fontSize: '13px' }}
              >
                Previous
              </button>

              {/* Backward Shift Button (<...) if windowStart is greater than 1 */}
              {windowStart > 1 && (
                <button 
                  onClick={handleShiftBackward}
                  style={{ padding: '5px 8px', borderRadius: '4px', border: '1px solid #cbd5e1', backgroundColor: '#fff', color: '#334155', cursor: 'pointer', fontWeight: 'bold', fontSize: '12px' }}
                  title="Shift navigation window back"
                >
                  &lt;...
                </button>
              )}

              {/* Exactly 5 Page Number Buttons centered on currentPage */}
              <div style={{ display: 'flex', gap: '4px' }}>
                {getVisiblePageNumbers().map(pageNum => (
                  <button
                    key={pageNum}
                    onClick={() => setCurrentPage(pageNum)}
                    style={{
                      padding: '5px 10px',
                      borderRadius: '4px',
                      border: '1px solid #cbd5e1',
                      backgroundColor: currentPage === pageNum ? '#3b82f6' : '#fff',
                      color: currentPage === pageNum ? '#fff' : '#334155',
                      cursor: 'pointer',
                      fontWeight: 'bold',
                      fontSize: '13px'
                    }}
                  >
                    {pageNum}
                  </button>
                ))}
              </div>

              {/* Forward Shift Button (...>) if more pages exist beyond current window */}
              {windowStart + 4 < totalPages && (
                <button 
                  onClick={handleShiftForward}
                  style={{ padding: '5px 8px', borderRadius: '4px', border: '1px solid #cbd5e1', backgroundColor: '#fff', color: '#334155', cursor: 'pointer', fontWeight: 'bold', fontSize: '12px' }}
                  title="Shift navigation window forward"
                >
                  ...&gt;
                </button>
              )}

              <button 
                onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                disabled={currentPage === totalPages}
                style={{ padding: '5px 10px', borderRadius: '4px', border: '1px solid #cbd5e1', backgroundColor: currentPage === totalPages ? '#f1f5f9' : '#fff', color: currentPage === totalPages ? '#94a3b8' : '#334155', cursor: currentPage === totalPages ? 'not-allowed' : 'pointer', fontWeight: 'bold', fontSize: '13px' }}
              >
                Next
              </button>

              {/* Direct Jump Input Form */}
              <form onSubmit={handleJumpToPage} style={{ display: 'flex', alignItems: 'center', gap: '4px', marginLeft: '8px' }}>
                <span style={{ fontSize: '13px', color: '#475569' }}>Go to:</span>
                <input 
                  type="number" 
                  min="1" 
                  max={totalPages} 
                  value={jumpInput} 
                  onChange={(e) => setJumpInput(e.target.value)} 
                  placeholder="Page"
                  style={{ width: '50px', padding: '4px 6px', borderRadius: '4px', border: '1px solid #cbd5e1', backgroundColor: '#fff', color: '#334155', fontSize: '13px', textAlign: 'center' }}
                />
                <button type="submit" style={{ padding: '4px 6px', borderRadius: '4px', border: '1px solid #cbd5e1', backgroundColor: '#f1f5f9', color: '#334155', cursor: 'pointer', fontSize: '13px', fontWeight: 'bold' }}>
                  Go
                </button>
              </form>
            </div>

            {/* Total Records Info */}
            <div style={{ fontSize: '13px', color: '#475569' }}>
              Page <strong>{currentPage}</strong> of <strong>{totalPages}</strong> ({sortedMembers.length} total)
            </div>

          </div>
        </div>
      )}

      {/* Add New Member Modal */}
      <CreateMemberModal 
        isOpen={isModalOpen} 
        onClose={() => setIsModalOpen(false)} 
        onMemberCreated={triggerRefresh} 
      />
    </div>
  );
}