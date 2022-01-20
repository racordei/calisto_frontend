// CTable properties
const ctable = {
  'ctable-filter': 'Filter'
}

const workorderTable = {
  'workorder-table-search': 'Search ID'
}

const generic = {
  'date-pattern': 'YYYY-MM-DD h:mm:ss A',
  'date-only-pattern': 'YYYY-MM-DD'
}

export default {
  failed: 'Action failed',
  success: 'Action was successful',
  ...ctable,
  ...workorderTable,
  ...generic
}
