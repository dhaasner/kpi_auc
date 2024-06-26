import React from 'react';
import autoBind from 'react-autobind';
import {actions} from 'js/actions';
import bem from 'js/bem';
import {stores} from 'js/stores';
import PopoverMenu from 'js/popoverMenu';
import alertify from 'alertifyjs';
import {
  MODAL_TYPES,
  VALIDATION_STATUSES_LIST,
} from 'js/constants';
import {PERMISSIONS_CODENAMES} from 'js/components/permissions/permConstants';
import {renderCheckbox} from 'utils';
import {userCan, userCanPartially} from 'js/components/permissions/utils';
import {buildFilterQuery} from './tableUtils';

/**
 * @prop asset
 * @prop pageSize
 * @prop data
 * @prop totalRowsCount
 * @prop selectedRows
 * @prop selectedAllPages
 * @prop fetchState
 * @prop onClearSelection
 */
class TableBulkOptions extends React.Component {
  constructor(props){
    super(props);

    this.currentDialog = null;

    autoBind(this);
  }

  componentDidMount() {
    actions.submissions.bulkDeleteStatus.completed.listen(this.closeCurrentDialog);
    actions.submissions.bulkDeleteStatus.failed.listen(this.closeCurrentDialog);
    actions.submissions.bulkPatchStatus.completed.listen(this.closeCurrentDialog);
    actions.submissions.bulkPatchStatus.failed.listen(this.closeCurrentDialog);
    actions.submissions.bulkDelete.completed.listen(this.closeCurrentDialog);
    actions.submissions.bulkDelete.failed.listen(this.closeCurrentDialog);
  }

  closeCurrentDialog() {
    if (this.currentDialog !== null) {
      this.currentDialog.destroy();
      this.currentDialog = null;
    }
  }

  onClearSelection() {
    this.props.onClearSelection();
  }

  onUpdateStatus(newStatus) {
    const data = {};
    let selectedCount;
    // setting empty value requires deleting the statuses with different API call
    const apiFn =
      newStatus === null
        ? actions.submissions.bulkDeleteStatus
        : actions.submissions.bulkPatchStatus;

    if (this.props.selectedAllPages) {
      if (this.props.fetchState.filtered.length) {
        // This is the case where user selected the all pages checkbox with some
        // data filtering
        const filterQuery = buildFilterQuery(
          this.props.asset.content.survey,
          this.props.fetchState.filtered
        );
        data.query = filterQuery.queryObj;
        data['validation_status.uid'] = newStatus;
      } else {
        // This is the case where user selected the all pages checkbox without
        // any data filtering
        data.confirm = true;
        data['validation_status.uid'] = newStatus;
      }
      selectedCount = this.props.totalRowsCount;
    } else {
      data.submission_ids = Object.keys(this.props.selectedRows);
      data['validation_status.uid'] = newStatus;
      selectedCount = data.submission_ids.length;
    }

    this.closeCurrentDialog(); // just for safety sake
    this.currentDialog = alertify.dialog('confirm');
    const opts = {
      title: t('Update status of selected submissions'),
      message: t('You have selected ## submissions. Are you sure you would like to update their status? This action is irreversible.').replace('##', selectedCount),
      labels: {ok: t('Update Validation Status'), cancel: t('Cancel')},
      onok: () => {
        apiFn(this.props.asset.uid, data);
        // keep the dialog open
        return false;
      },
      oncancel: this.closeCurrentDialog,
    };
    this.currentDialog.set(opts).show();
  }

  onDelete() {
    const data = {};
    let selectedCount;

    if (this.props.selectedAllPages) {
      if (this.props.fetchState.filtered.length) {
        data.query = {};
        this.props.fetchState.filtered.map((filteredItem) => {
          data.query[filteredItem.id] = filteredItem.value;
        });
      } else {
        data.confirm = true;
      }
      selectedCount = this.props.totalRowsCount;
    } else {
      data.submission_ids = Object.keys(this.props.selectedRows);
      selectedCount = data.submission_ids.length;
    }
    let msg;
    let onshow;
    msg = t('You are about to permanently delete ##count## submissions. It is not possible to recover deleted submissions.')
      .replace('##count##', selectedCount);
    msg = `${renderCheckbox('dt1', msg)}`;

    this.closeCurrentDialog(); // just for safety sake
    this.currentDialog = alertify.dialog('confirm');
    onshow = () => {
      let ok_button = this.currentDialog.elements.buttons.primary.firstChild;
      let $els = $('.alertify-toggle input');

      ok_button.disabled = true;

      $els.each(function () {$(this).prop('checked', false);});
      $els.change(function () {
        ok_button.disabled = false;
        $els.each(function () {
          if (!$(this).prop('checked')) {
            ok_button.disabled = true;
          }
        });
      });
    };

    const opts = {
      title: t('Delete selected submissions'),
      message: msg,
      labels: {ok: t('Delete selected'), cancel: t('Cancel')},
      onshow: onshow,
      onok: () => {
        actions.submissions.bulkDelete(this.props.asset.uid, data);
        // keep the dialog open
        return false;
      },
      oncancel: this.closeCurrentDialog,
    };
    this.currentDialog.set(opts).show();
  }

  onEdit() {
    stores.pageState.showModal({
      type: MODAL_TYPES.BULK_EDIT_SUBMISSIONS,
      asset: this.props.asset,
      data: this.props.data,
      totalSubmissions: this.props.totalRowsCount,
      selectedSubmissions: Object.keys(this.props.selectedRows),
    });
  }

  render() {
    let selectedCount = Object.keys(this.props.selectedRows).length;
    if (this.props.selectedAllPages) {
      selectedCount = this.props.totalRowsCount;
    }
    const selectedLabel = t('##count## selected').replace('##count##', selectedCount);

    const maxPageRes = Math.min(this.props.pageSize, this.props.data.length);
    const isSelectAllAvailable = (
      Object.keys(this.props.selectedRows).length === maxPageRes &&
      this.props.totalRowsCount > this.props.pageSize
    );

    return (
      <bem.TableMeta__bulkOptions>
        {selectedCount > 1 &&
          <bem.KoboLightBadge>
            {selectedLabel}
            <a className='bulk-clear-badge-icon' onClick={this.onClearSelection}>&times;</a>
          </bem.KoboLightBadge>
        }

        {selectedCount > 1 && <span>:</span>}

        {Object.keys(this.props.selectedRows).length > 0 &&
          <PopoverMenu type='bulkUpdate-menu' triggerLabel={t('Change status')} >
            {(userCan(PERMISSIONS_CODENAMES.validate_submissions, this.props.asset) || userCanPartially(PERMISSIONS_CODENAMES.validate_submissions, this.props.asset)) &&
              VALIDATION_STATUSES_LIST.map((item, n) => {
                return (
                  <bem.PopoverMenu__link
                    onClick={this.onUpdateStatus.bind(this, item.value)}
                    key={n}
                  >
                    {t('Set status: ##status##').replace('##status##', item.label)}
                  </bem.PopoverMenu__link>
                );
              })
            }
          </PopoverMenu>
        }

        {Object.keys(this.props.selectedRows).length > 0 && this.props.asset.deployment__active && (userCan(PERMISSIONS_CODENAMES.change_submissions, this.props.asset) || userCanPartially(PERMISSIONS_CODENAMES.change_submissions, this.props.asset)) &&
          <bem.KoboLightButton
            m='blue'
            onClick={this.onEdit}
            disabled={this.props.selectedAllPages && isSelectAllAvailable}
          >
            <i className='k-icon k-icon-edit table-meta__additional-text'/>
            {t('Edit')}
          </bem.KoboLightButton>
        }

        {Object.keys(this.props.selectedRows).length > 0 && (userCan(PERMISSIONS_CODENAMES.delete_submissions, this.props.asset) || userCanPartially(PERMISSIONS_CODENAMES.delete_submissions, this.props.asset)) &&
          <bem.KoboLightButton
            m='red'
            onClick={this.onDelete}
          >
            <i className='k-icon k-icon-trash table-meta__additional-text'/>
            {t('Delete')}
          </bem.KoboLightButton>
        }
      </bem.TableMeta__bulkOptions>
    );
  }
}

export default TableBulkOptions;
