import { useState, useEffect, useMemo } from 'react';
import { DeleteMembers, GetAllMembers } from '../api/memberService';
import CreateMemberModal from './CreateMemberModal';

// One list of column definitions drives the column picker, the headers,
// and the cells, so adding a column later means one entry here plus a
// case in renderCell.
const COLUMNS = [
  { key: 'name', header: 'Name', pickerLabel: 'Name (Last, First)' },
  { key: 'firstName', header: 'First Name', pickerLabel: 'First Name' },
  { key: 'lastName', header: 'Last Name', pickerLabel: 'Last Name' },
  { key: 'employer', header: 'Employer', pickerLabel: 'Employer' },
];

const PAGE_WINDOW_SIZE = 5; // number of page buttons shown
const WINDOW_SHIFT = 3;     // pages moved by the <... and ...> buttons

function maxWindowStart(totalPages) {
  return Math.max(1, totalPages - (PAGE_WINDOW_SIZE - 1));
}

// First page number of a 5-page window centered on `page` where possible.
function centeredWindowStart(page, totalPages) {
  const ideal = page - Math.floor(PAGE_WINDOW_SIZE / 2);
  return Math.min(Math.max(1, ideal), maxWindowStart(totalPages));
}

// Case- and accent-insensitive comparison, so "Élise" sorts near "Elise".
function compareText(a, b) {
  return a.localeCompare(b, undefined, { sensitivity: 'base' });
}

function renderCell(member, key) {
  switch (key) {
    case 'name':
      return <span style={linkTextStyle}>{member.lastName}, {member.firstName}</span>;
    case 'firstName':
      return member.firstName;
    case 'lastName':
      return member.lastName;
    case 'employer':
      return member.employer || 'None';
    default:
      return null;
  }
}

export default function MemberList({ refreshTrigger, onSelectMember }) {
  const [members, setMembers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Modal & Selection State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [internalRefresh, setInternalRefresh] = useState(0);
  const [selectedMemberIds, setSelectedMemberIds] = useState([]);
  const [bulkBusy, setBulkBusy] = useState(false);

  // Search & Filter State
  const [searchQuery, setSearchQuery] = useState('');
  const [showAdvancedFilters, setShowAdvancedFilters] = useState(false);
  const [showColumnConfig, setShowColumnConfig] = useState(false);

  // Sorting State ('name' so the default sort shows an arrow on a visible column)
  const [sortConfig, setSortConfig] = useState({ key: 'name', dir: 'asc' });

  // Column Visibility State
  const [visibleColumns, setVisibleColumns] = useState({
    name: true,
    firstName: false,
    lastName: false,
    employer: true,
  });

  // Pagination State
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [jumpInput, setJumpInput] = useState('');
  const [windowStart, setWindowStart] = useState(1); // first page in the 5-button window

  // FIX: previously this also called refreshTrigger(), but refreshTrigger is a
  // number, not a function. Once it became non-zero, every create and bulk
  // delete threw "refreshTrigger is not a function" after succeeding.
  const triggerRefresh = () => setInternalRefresh((prev) => prev + 1);

  // Load members. The `cancelled` flag prevents a slow, outdated request
  // from overwriting newer data (and avoids state updates after unmount).
  useEffect(() => {
    let cancelled = false;

    async function loadMembers() {
      setLoading(true);
      try {
        const data = await GetAllMembers();
        if (cancelled) return;
        setMembers(data);
        setError('');
        // Drop selections for members that no longer exist.
        const existing = new Set(data.map((m) => m.recno));
        setSelectedMemberIds((prev) => prev.filter((id) => existing.has(id)));
      } catch {
        if (!cancelled) setError('Failed to load member list.');
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    loadMembers();
    return () => {
      cancelled = true;
    };
  }, [refreshTrigger, internalRefresh]);

  // ---------- Filtering & sorting (memoized so they don't rerun on every render) ----------

  const filteredMembers = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();
    if (!query) return members;

    return members.filter((m) => {
      const first = m.firstName.toLowerCase();
      const last = m.lastName.toLowerCase();
      const employer = m.employer.toLowerCase();
      return (
        first.includes(query) ||
        last.includes(query) ||
        employer.includes(query) ||
        `${first} ${last}`.includes(query) ||  // "jane doe"
        `${last}, ${first}`.includes(query)    // "doe, jane"
      );
    });
  }, [members, searchQuery]);

  const sortedMembers = useMemo(() => {
    const direction = sortConfig.dir === 'asc' ? 1 : -1;
    return [...filteredMembers].sort((a, b) => {
      let result;
      switch (sortConfig.key) {
        case 'firstName':
          result = compareText(a.firstName, b.firstName) || compareText(a.lastName, b.lastName);
          break;
        case 'employer':
          result = compareText(a.employer, b.employer) || compareText(a.lastName, b.lastName);
          break;
        default: // 'name' and 'lastName': last name, then first name as a tiebreaker
          result = compareText(a.lastName, b.lastName) || compareText(a.firstName, b.firstName);
      }
      return result * direction;
    });
  }, [filteredMembers, sortConfig]);

  // ---------- Pagination (derived values instead of syncing effects) ----------

  const totalPages = Math.max(1, Math.ceil(sortedMembers.length / pageSize));

  // FIX: clamp rather than reset. If a delete removes the last page, the user
  // lands on the new last page instead of being thrown back to page 1.
  const safePage = Math.min(currentPage, totalPages);
  const safeWindowStart = Math.min(windowStart, maxWindowStart(totalPages));

  const paginatedMembers = sortedMembers.slice((safePage - 1) * pageSize, safePage * pageSize);

  const goToPage = (page) => {
    const target = Math.min(Math.max(1, page), totalPages);
    setCurrentPage(target);
    setWindowStart(centeredWindowStart(target, totalPages));
  };

  const getVisiblePageNumbers = () => {
    const pages = [];
    const end = Math.min(totalPages, safeWindowStart + PAGE_WINDOW_SIZE - 1);
    for (let i = safeWindowStart; i <= end; i++) pages.push(i);
    return pages;
  };

  // Shift the window without changing the current page.
  const handleShiftForward = () => {
    setWindowStart(Math.min(maxWindowStart(totalPages), safeWindowStart + WINDOW_SHIFT));
  };
  const handleShiftBackward = () => {
    setWindowStart(Math.max(1, safeWindowStart - WINDOW_SHIFT));
  };

  const handleJumpToPage = (e) => {
    e.preventDefault();
    const pageNum = parseInt(jumpInput, 10);
    if (!isNaN(pageNum) && pageNum >= 1 && pageNum <= totalPages) {
      goToPage(pageNum);
      setJumpInput('');
    } else {
      alert(`Invalid page number. Please enter a number between 1 and ${totalPages}.`);
    }
  };

  // ---------- Search, sort, and page-size handlers ----------

  const handleSearchChange = (e) => {
    setSearchQuery(e.target.value);
    goToPage(1);
    // FIX: clear selections when the search changes, so a bulk delete can't
    // include members the user can no longer see.
    setSelectedMemberIds([]);
  };

  const handlePageSizeChange = (e) => {
    setPageSize(Number(e.target.value));
    setCurrentPage(1);
    setWindowStart(1);
  };

  const handleSort = (key) => {
    setSortConfig((prev) => ({
      key,
      dir: prev.key === key && prev.dir === 'asc' ? 'desc' : 'asc',
    }));
  };

  const renderSortArrow = (key) => {
    if (sortConfig.key !== key) return <span style={{ color: '#94a3b8', marginLeft: '5px' }}>⇕</span>;
    return <span style={{ color: '#38bdf8', marginLeft: '5px' }}>{sortConfig.dir === 'asc' ? '▲' : '▼'}</span>;
  };

  // ---------- Columns ----------

  const visibleColumnDefs = COLUMNS.filter((c) => visibleColumns[c.key]);
  const visibleColumnCount = visibleColumnDefs.length;

  const toggleColumn = (key, checked) => {
    if (!checked && visibleColumnCount === 1) return; // always keep one column visible
    setVisibleColumns((prev) => ({ ...prev, [key]: checked }));
  };

  // ---------- Selection ----------
  // FIX: "select all" now means the rows on the current page, which is what
  // users expect from a header checkbox.

  const pageIds = paginatedMembers.map((m) => m.recno);
  const selectedOnPageCount = pageIds.filter((id) => selectedMemberIds.includes(id)).length;
  const allPageSelected = pageIds.length > 0 && selectedOnPageCount === pageIds.length;
  const somePageSelected = selectedOnPageCount > 0 && !allPageSelected;
  const selectedOffPageCount = selectedMemberIds.length - selectedOnPageCount;

  const handleSelectAll = (e) => {
    const { checked } = e.target;
    setSelectedMemberIds((prev) =>
      checked ? [...new Set([...prev, ...pageIds])] : prev.filter((id) => !pageIds.includes(id))
    );
  };

  const handleSelectRow = (recno) => {
    setSelectedMemberIds((prev) =>
      prev.includes(recno) ? prev.filter((id) => id !== recno) : [...prev, recno]
    );
  };

  // FIX: reports partial failures honestly and always refreshes afterward.
  const handleBulkDelete = async () => {
    const count = selectedMemberIds.length;
    if (!window.confirm(`Are you sure you want to delete ${count} selected member(s)? This cannot be undone.`)) {
      return;
    }

    setBulkBusy(true);
    try {
      const { failed } = await DeleteMembers(selectedMemberIds);
      setSelectedMemberIds(failed); // failed rows stay selected so the user can retry
      if (failed.length > 0) {
        alert(
          `${count - failed.length} of ${count} member(s) deleted. ` +
          `${failed.length} could not be deleted and remain selected.`
        );
      }
    } catch {
      alert('Bulk delete failed unexpectedly. The list has been refreshed to show the current state.');
    } finally {
      setBulkBusy(false);
      triggerRefresh();
    }
  };

  const handleBulkUpdate = () => {
    alert(`Mass Update triggered for ${selectedMemberIds.length} member(s). (Stub action)`);
  };

  // ---------- Render ----------

  return (
    <div style={{ width: '100%' }}>

      {/* ROW 1: TITLE & PRIMARY ACTION BUTTONS */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '15px', flexWrap: 'wrap', gap: '15px' }}>
        <h1 style={{ color: '#334155', margin: 0, fontSize: '24px', letterSpacing: '0.5px' }}>MEMBERS LIST</h1>

        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
          <button
            onClick={() => { setShowColumnConfig(!showColumnConfig); setShowAdvancedFilters(false); }}
            style={toolbarButtonStyle(showColumnConfig)}
          >
            Columns
          </button>
          <button
            onClick={() => { setShowAdvancedFilters(!showAdvancedFilters); setShowColumnConfig(false); }}
            style={toolbarButtonStyle(showAdvancedFilters)}
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
          type="search"
          placeholder="Search by name or employer..."
          aria-label="Search members"
          value={searchQuery}
          onChange={handleSearchChange}
          style={{ padding: '9px 12px', borderRadius: '4px', border: '1px solid #cbd5e1', width: '100%', maxWidth: '350px', backgroundColor: '#fff', color: '#334155', fontSize: '14px', boxSizing: 'border-box' }}
        />

        <div>
          {selectedMemberIds.length > 0 ? (
            <div style={{ display: 'flex', gap: '10px', alignItems: 'center', flexWrap: 'wrap' }}>
              <span style={{ fontSize: '14px', color: '#334155', fontWeight: 'bold' }}>
                {selectedMemberIds.length} selected
                {selectedOffPageCount > 0 ? ` (${selectedOffPageCount} on other pages)` : ''}
              </span>
              <button
                onClick={() => setSelectedMemberIds([])}
                disabled={bulkBusy}
                style={{ background: 'none', border: 'none', color: '#3b82f6', cursor: 'pointer', fontSize: '13px', textDecoration: 'underline', padding: 0 }}
              >
                Clear
              </button>
              <button onClick={handleBulkUpdate} disabled={bulkBusy} style={{ backgroundColor: '#0284c7', color: '#fff', border: 'none', padding: '8px 15px', borderRadius: '4px', cursor: 'pointer', fontWeight: 'bold', fontSize: '13px' }}>
                Mass Update
              </button>
              <button onClick={handleBulkDelete} disabled={bulkBusy} style={{ backgroundColor: '#dc2626', color: '#fff', border: 'none', padding: '8px 15px', borderRadius: '4px', cursor: bulkBusy ? 'wait' : 'pointer', fontWeight: 'bold', fontSize: '13px' }}>
                {bulkBusy ? 'Deleting...' : 'Delete Selected'}
              </button>
            </div>
          ) : (
            <span style={{ fontSize: '14px', color: '#64748b' }}>Showing {sortedMembers.length} total record(s)</span>
          )}
        </div>
      </div>

      {/* COLUMN CONFIGURATION PANEL */}
      {showColumnConfig && (
        <div style={panelStyle}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
            <strong style={{ color: '#334155', fontSize: '14px' }}>Toggle Visible Columns:</strong>
            <button onClick={() => setShowColumnConfig(false)} aria-label="Close column settings" style={closeButtonStyle}>✕</button>
          </div>
          <div style={{ display: 'flex', gap: '20px', flexWrap: 'wrap' }}>
            {COLUMNS.map((col) => {
              const isOnlyVisible = visibleColumns[col.key] && visibleColumnCount === 1;
              return (
                <label key={col.key} style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '14px', color: '#334155', cursor: isOnlyVisible ? 'not-allowed' : 'pointer' }}>
                  <input
                    type="checkbox"
                    checked={visibleColumns[col.key]}
                    disabled={isOnlyVisible}
                    onChange={(e) => toggleColumn(col.key, e.target.checked)}
                  />
                  {col.pickerLabel}
                </label>
              );
            })}
          </div>
        </div>
      )}

      {/* ADVANCED FILTERS PANEL */}
      {showAdvancedFilters && (
        <div style={{ ...panelStyle, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <span style={{ color: '#475569', fontSize: '14px' }}><strong>Filter Criteria:</strong> Macro language and intricate custom rules builder pending integration.</span>
          <button onClick={() => setShowAdvancedFilters(false)} aria-label="Close filters" style={closeButtonStyle}>✕</button>
        </div>
      )}

      {loading && <p style={{ color: '#64748b' }}>Loading members...</p>}
      {error && <p style={{ color: 'red' }}>{error}</p>}

      {/* MEMBER TABLE */}
      {!loading && !error && (
        <div style={{ backgroundColor: '#fff', borderRadius: '8px', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)', border: '1px solid #cbd5e1', overflow: 'hidden' }}>
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
              <thead>
                <tr style={{ backgroundColor: '#334155', color: '#fff' }}>
                  <th style={{ padding: '12px 15px', width: '40px', textAlign: 'center' }}>
                    <input
                      type="checkbox"
                      aria-label="Select all members on this page"
                      checked={allPageSelected}
                      // Shows a dash when only some rows on the page are selected
                      ref={(el) => { if (el) el.indeterminate = somePageSelected; }}
                      onChange={handleSelectAll}
                      style={{ cursor: 'pointer' }}
                    />
                  </th>
                  {visibleColumnDefs.map((col) => (
                    <th
                      key={col.key}
                      onClick={() => handleSort(col.key)}
                      aria-sort={sortConfig.key === col.key ? (sortConfig.dir === 'asc' ? 'ascending' : 'descending') : 'none'}
                      style={{ padding: '12px 20px', fontWeight: 'bold', fontSize: '14px', cursor: 'pointer', userSelect: 'none' }}
                    >
                      {col.header} {renderSortArrow(col.key)}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {paginatedMembers.length === 0 ? (
                  <tr>
                    {/* FIX: span matches the actual number of columns */}
                    <td colSpan={visibleColumnCount + 1} style={{ padding: '30px', textAlign: 'center', color: '#64748b' }}>
                      {members.length === 0 ? 'No members yet. Use "+ Add New Member" to create one.' : 'No members match your search criteria.'}
                    </td>
                  </tr>
                ) : (
                  paginatedMembers.map((member) => {
                    const isChecked = selectedMemberIds.includes(member.recno);
                    return (
                      // FIX: the whole row opens the profile, so hiding the Name
                      // column no longer removes the only way in. Rows are also
                      // keyboard-reachable (Tab, then Enter).
                      <tr
                        key={member.recno ?? member.memberId}
                        onClick={() => onSelectMember(member)}
                        onKeyDown={(e) => { if (e.key === 'Enter' && e.target === e.currentTarget) onSelectMember(member); }}
                        tabIndex={0}
                        title="Open member profile"
                        style={{ borderBottom: '1px solid #cbd5e1', backgroundColor: isChecked ? '#f8fafc' : '#fff', cursor: 'pointer' }}
                      >
                        {/* stopPropagation keeps checkbox clicks from opening the profile */}
                        <td style={{ padding: '15px', textAlign: 'center' }} onClick={(e) => e.stopPropagation()}>
                          <input
                            type="checkbox"
                            aria-label={`Select ${member.lastName}, ${member.firstName}`}
                            checked={isChecked}
                            onChange={() => handleSelectRow(member.recno)}
                            style={{ cursor: 'pointer' }}
                          />
                        </td>
                        {visibleColumnDefs.map((col) => (
                          <td key={col.key} style={cellStyle}>{renderCell(member, col.key)}</td>
                        ))}
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>

          {/* PAGINATION FOOTER BAR */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px 20px', backgroundColor: '#f8fafc', borderTop: '1px solid #cbd5e1', flexWrap: 'wrap', gap: '15px' }}>

            {/* Rows Per Page */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '13px', color: '#475569' }}>
              <span>Rows per page:</span>
              <select
                value={pageSize}
                onChange={handlePageSizeChange}
                style={{ padding: '4px 8px', borderRadius: '4px', border: '1px solid #cbd5e1', backgroundColor: '#fff', color: '#334155' }}
              >
                <option value={10}>10</option>
                <option value={25}>25</option>
                <option value={50}>50</option>
                <option value={100}>100</option>
              </select>
            </div>

            {/* Page buttons & window shift controls */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flexWrap: 'wrap' }}>
              <button onClick={() => goToPage(safePage - 1)} disabled={safePage === 1} style={pagerButtonStyle(safePage === 1)}>
                Previous
              </button>

              {safeWindowStart > 1 && (
                <button onClick={handleShiftBackward} style={shiftButtonStyle} title="Shift navigation window back">
                  &lt;...
                </button>
              )}

              <div style={{ display: 'flex', gap: '4px' }}>
                {getVisiblePageNumbers().map((pageNum) => (
                  <button
                    key={pageNum}
                    onClick={() => goToPage(pageNum)}
                    aria-current={safePage === pageNum ? 'page' : undefined}
                    style={pageNumberStyle(safePage === pageNum)}
                  >
                    {pageNum}
                  </button>
                ))}
              </div>

              {safeWindowStart + PAGE_WINDOW_SIZE - 1 < totalPages && (
                <button onClick={handleShiftForward} style={shiftButtonStyle} title="Shift navigation window forward">
                  ...&gt;
                </button>
              )}

              <button onClick={() => goToPage(safePage + 1)} disabled={safePage === totalPages} style={pagerButtonStyle(safePage === totalPages)}>
                Next
              </button>

              {/* Direct Jump Input Form */}
              <form onSubmit={handleJumpToPage} style={{ display: 'flex', alignItems: 'center', gap: '4px', marginLeft: '8px' }}>
                <label htmlFor="member-page-jump" style={{ fontSize: '13px', color: '#475569' }}>Go to:</label>
                <input
                  id="member-page-jump"
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
              Page <strong>{safePage}</strong> of <strong>{totalPages}</strong> ({sortedMembers.length} total)
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

// ---------- Shared styles (pulled out to cut repetition) ----------

const toolbarButtonStyle = (active) => ({
  backgroundColor: active ? '#334155' : '#475569',
  color: '#fff',
  border: 'none',
  padding: '9px 15px',
  borderRadius: '4px',
  cursor: 'pointer',
  fontWeight: 'bold',
  fontSize: '14px',
  whiteSpace: 'nowrap',
});

const panelStyle = {
  backgroundColor: '#f8fafc',
  padding: '15px 20px',
  borderRadius: '8px',
  border: '1px solid #cbd5e1',
  marginBottom: '20px',
};

const closeButtonStyle = { background: 'none', border: 'none', color: '#64748b', cursor: 'pointer', fontWeight: 'bold' };

const cellStyle = { padding: '15px 20px', color: '#334155', fontSize: '14px' };

const linkTextStyle = { color: '#3b82f6', textDecoration: 'underline', fontWeight: '500' };

const pagerButtonStyle = (disabled) => ({
  padding: '5px 10px',
  borderRadius: '4px',
  border: '1px solid #cbd5e1',
  backgroundColor: disabled ? '#f1f5f9' : '#fff',
  color: disabled ? '#94a3b8' : '#334155',
  cursor: disabled ? 'not-allowed' : 'pointer',
  fontWeight: 'bold',
  fontSize: '13px',
});

const pageNumberStyle = (active) => ({
  padding: '5px 10px',
  borderRadius: '4px',
  border: '1px solid #cbd5e1',
  backgroundColor: active ? '#3b82f6' : '#fff',
  color: active ? '#fff' : '#334155',
  cursor: 'pointer',
  fontWeight: 'bold',
  fontSize: '13px',
});

const shiftButtonStyle = {
  padding: '5px 8px',
  borderRadius: '4px',
  border: '1px solid #cbd5e1',
  backgroundColor: '#fff',
  color: '#334155',
  cursor: 'pointer',
  fontWeight: 'bold',
  fontSize: '12px',
};
