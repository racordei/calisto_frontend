<template>
  <div class="q-flow-table">
    <q-table
      :title="title"
      :rows="rows"
      :columns="columnsWithActions"
      :row-key="rowKey"
      :style="tableStyle"
      :pagination="pagination"
      :grid="$q.screen.lt.sm"
      :loading="loading"
      :filter="filterText"
      :flat="flat"
      :separator="separator"
      :hide-pagination="hidePagination"
      :selection="selection"
      :visible-columns="visibleColumns"
      v-model:selected="selectedRows"
    >
      <template v-slot:loading>
        <slot name="loading">
          <q-inner-loading showing color="primary" />
        </slot>
      </template>

      <template v-slot:top-right>
        <slot name="top-right-before" />
        <slot name="top-right">
          <q-input
            filled
            dense
            debounce="300"
            :placeholder="$t('ctable-filter')"
            v-model="filterText"
            v-if="rows.length"
            @keydown.escape.prevent="filterText = null">
            <template v-slot:append>
              <q-icon name="o_filter_alt" />
            </template>
          </q-input>
          <q-separator vertical inset spaced v-if="isButtonAdd" />
          <slot name="top-right-after-action" />
          <q-btn size="12px" round icon="add" color="primary" @click="$emit('add')" v-if="isButtonAdd">
            <slot name="add-button-tooltip" />
          </q-btn>
        </slot>
        <slot name="top-right-after" />

        <q-separator vertical inset spaced />
        <q-btn size="12px" round icon="view_column" color="white" text-color="blue" @click="$emit('add')">
          <q-menu>
            <div class="row no-wrap q-pa-md">
              <div class="column">
                <div class="text-h6 q-mb-md">Show/Hide columns</div>
                <q-toggle
                  v-for="(col, index) in columns"
                  :key="index"
                  :label="col.label"
                  v-model="visibleColumnsRef[col.name]"
                  v-show="!col.required"
                />
              </div>
              <q-separator vertical inset class="q-mx-lg" />
              <div class="column items-center">
                <q-avatar size="72px">
                  <img src="https://cdn.quasar.dev/img/avatar4.jpg">
                </q-avatar>

                <div class="text-subtitle1 q-mt-md q-mb-xs">John Doe</div>

                <q-btn
                  color="primary"
                  label="Logout"
                  push
                  size="sm"
                  v-close-popup
                />
              </div>
            </div>
          </q-menu>
        </q-btn>
      </template>

      <template v-slot:body="props">
        <q-tr :props="props" :style="tableRowStyle(props)" :class="tableRowClass(props)">
          <!-- checkbox column -->
          <q-td key="checkbox" v-if="selection !== 'none'">
            <q-checkbox v-model="props.selected"/>
          </q-td>

          <slot v-for="col in columnsNoAction(props.cols)" :name="`body-cell-${col.name}`" :props="{...props, col}">
            <!-- Boolean TD style object -->
            <q-td
              v-if="typeof(col.value) === 'boolean' && (col.flowstyle === undefined || !!col.flowstyle)"
              :key="col.name"
              :props="props"
              :auto-width="col.autowidth">
              <q-icon v-if="col.value" name="check_circle_outline" size="32px" color="positive" />
              <q-icon v-else name="remove_circle_outline" size="32px" color="negative" />
            </q-td>
            <!-- Date TD style object -->
            <q-td
              v-else-if="isDate(col.value)"
              :key="col.name"
              :props="props">
              {{ formatDate(col.value, col.dateOnly) }}
            </q-td>
            <!-- Standard TD object -->
            <q-td
              v-else
              :key="col.name"
              :props="props">
              {{ col.value }}
            </q-td>
          </slot>

          <slot name="body-cell-actions">
            <q-td key="actions" class="text-right" auto-width v-if="usingActionsColumn">
              <slot name="body-cell-before-actions" />
              <q-btn
                flat
                dense
                round
                icon="edit"
                size="12px"
                color="primary"
                class="gt-xs"
                :class="{ 'invisible': !isButtonEdit(props.row.buttonEdit) }"
                @click="$emit('edit', props.key)"
                v-if="buttonAll || buttonEdit" />
              <slot name="body-cell-between-actions" v-bind="props.row" />
              <q-btn
                flat
                dense
                round
                icon="delete"
                size="12px"
                color="negative"
                class="gt-xs"
                :class="{ 'invisible': !isButtonDelete(props.row.buttonDelete) }"
                @click="$emit('delete', props.key)"
                v-if="buttonAll || buttonDelete" />
              <slot name="body-cell-after-actions" />
            </q-td>
          </slot>
        </q-tr>
      </template>
    </q-table>
    <q-resize-observer @resize="onResize" />
  </div>
</template>

<script>
import { defineComponent, ref, watchEffect } from 'vue'
import { date } from 'quasar'

const quasarFormatDate = (() => {
  const { formatDate } = date
  return formatDate
})()

let columnsWatcher = () => {}

export default defineComponent({
  name: 'CTable',

  props: {
    title: {
      type: String
    },
    rows: {
      type: Array,
      default: () => []
    },
    columns: {
      type: Array,
      default: () => []
    },
    buttonAll: {
      type: Boolean,
      default: false
    },
    buttonAdd: {
      type: Boolean,
      default: false
    },
    buttonEdit: {
      type: Boolean,
      default: false
    },
    buttonDelete: {
      type: Boolean,
      default: false
    },
    rowKey: {
      type: [String, Number],
      default: 'id'
    },
    pagination: {
      type: [Object],
      default: () => ({ rowsPerPage: 50 })
    },
    resizetrigger: {
      type: [String, Number, Boolean]
    },
    loading: {
      type: [Boolean],
      default: false
    },
    flat: {
      type: Boolean,
      default: false
    },
    separator: {
      type: String,
      default: 'horizontal'
    },
    selection: {
      type: String,
      default: 'none',
      validator: (value) => ['single', 'multiple', 'none'].includes(value)
    },
    hidePagination: {
      type: Boolean,
      default: false
    },
    rowStyle: {
      type: [String, Object, Function],
      default: null
    },
    rowClass: {
      type: [String, Object, Function],
      default: null
    }
  },
  
  setup() {
    return {
      filterText: ref(''),
      tableHeight: ref(0),
      debounceTimeout: null,
      selectedRows: ref([]),
      visibleColumnsRef: ref({})
    }
  },

  watch: {
    resizetrigger(val) {
      this.onResizeMiddleware()
    },
    columns(val) {
      console.log(val);
    }
  },

  computed: {
    isButtonAdd() {
      return this.buttonAll || this.buttonAdd
    },
    tableStyle() {
      return {
        minHeight: `${this.tableHeight}px`,
        maxHeight: `${this.tableHeight}px`
      }
    },
    usingActionsColumn() {
      return this.buttonAll || this.buttonDelete || this.buttonEdit
    },
    /** @returns {Array} */
    columnsWithActions() {
      const cols = [...this.columns]
      if (this.usingActionsColumn) {
        cols.push({
          name: 'actions',
          label: '',
          field: 'actions'
        })
      }
      return cols
    },
    /** @returns {Object} */
    columnsNoAction() {
      return (cols) => cols.filter(col => col.name !== 'actions')
    },
    visibleColumns() {
      return Object.keys(this.visibleColumnsRef).filter(key => {
        return this.visibleColumnsRef[key]
      })
    },
    toogleVisibleColumn: {
      get() {
        console.log(arguments);
        return true
      },
      set(val) {
        console.log(val);
        return val
      }
    }
  },

  methods: {
    isButtonEdit(buttonEdit) {
      if (this.buttonAll) {
        return buttonEdit === undefined || buttonEdit === true
      } else {
        return this.buttonEdit && (buttonEdit === undefined || buttonEdit === true)
      }
    },
    isButtonDelete(buttonDelete) {
      if (this.buttonAll) {
        return buttonDelete === undefined || buttonDelete === true
      } else {
        return this.buttonDelete && (buttonDelete === undefined || buttonDelete === true)
      }
    },
    isDate(val) {
      if (val instanceof Date) {
        return true
      } else if (typeof (val) === 'string') {
        return (/^[0-9-]{10}T[0-9:]{8}\.[0-9]{1,3}Z$/).test(String(val))
      }
    },
    getHeight(style, includes) {
      let _includes = ['noone']
      if (includes instanceof String) {
        _includes = [includes]
      } else if (includes instanceof Array) {
        _includes = includes
      }
      const props = [
        'paddingTop',
        'paddingBottom',
        'marginTop',
        'marginBottom',
        ..._includes
      ]
      return props
        .filter(prop => style[prop])
        .map(prop => parseFloat(style[prop]))
        .reduce((h, v) => h + v, 0)
    },
    onResize(size) {
      const doc = document.querySelector('.q-page')
      if (this.debounceTimeout) {
        clearTimeout(this.debounceTimeout)
      }
      this.debounceTimeout = setTimeout(() => {
        if (doc) {
          const docStyle = window.getComputedStyle(doc)
          let height = parseFloat(docStyle.height)
          if (height < window.innerHeight) {
            height -= this.getHeight(docStyle)
            for (let i = 0; i < doc.childNodes.length; i++) {
              const child = doc.childNodes[i]
              const cn = child && child.className ? child.className : ''
              if (child instanceof Element && !cn.match('q-flow-table|q-table__container')) {
                const childStyle = window.getComputedStyle(child)
                const childHeight = this.getHeight(childStyle, ['height'])
                height -= childHeight
              }
            }
            this.tableHeight = Math.max(height, 162)
          }
        }
      }, 50)
    },
    onResizeMiddleware(event) {
      const doc = document.querySelector('.q-flow-table')
      const docStyle = window.getComputedStyle(doc)
      this.tableHeight = 0
      this.onResize({
        width: parseFloat(docStyle.width),
        height: parseFloat(docStyle.height)
      })
    },
    handleStyle(obj, props) {
      let prop

      if (typeof (obj) === 'function') {
        prop = obj(props)
      } else {
        prop = obj
      }

      if (typeof (prop) === 'object') {
        return prop
      } else if (typeof (prop) === 'string') {
        return Object.fromEntries(
          prop.split(' ')
            .map(cl => [cl, true]))
      }

      return {}
    },
    tableRowStyle(props) {
      return this.handleStyle(this.rowStyle, props)
    },
    tableRowClass(props) {
      return this.handleStyle(this.rowClass, props)
    },
    formatDate(val, dateOnly) {
      const pattern = dateOnly ? this.$t('date-only-pattern') : this.$t('date-pattern')
      return quasarFormatDate(val, pattern)
    }
  },

  created() {
    columnsWatcher = watchEffect(() => {
      this.columns.forEach(column => {
        this.visibleColumnsRef[column.name] = !column.hidden
      })
    })

    window.addEventListener('resize', this.onResizeMiddleware)
  },
  unmounted() {
    columnsWatcher()
    window.removeEventListener('resize', this.onResizeMiddleware)
  }
})
</script>

<style lang="scss">
.q-table__container {
  /* height or max-height is important */
  height: 100px;

  .q-table__top,
  .q-table__bottom,
  thead tr:first-child th {
    /* bg color is important for th; just specify one */
    background-color: #ffffff;
  }

  thead tr th {
    position: sticky;
    z-index: 1;
  }

  thead tr:first-child th {
    top: 0;
  }

  // .q-inner-loading {
  //   z-index: 2;
  // }
  /* this is when the loading indicator appears */
  .q-table--loading thead tr:last-child th {
    /* height of all previous header rows */
    top: 48px;
  }
}
</style>