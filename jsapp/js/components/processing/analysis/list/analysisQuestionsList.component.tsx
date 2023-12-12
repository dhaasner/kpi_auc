import React, {useCallback, useContext} from 'react';
import AnalysisQuestionsContext from '../analysisQuestions.context';
import styles from './analysisQuestionsList.module.scss';
import AnalysisQuestionRow from './analysisQuestionRow.component';
import {DndProvider} from 'react-dnd';
import {HTML5Backend} from 'react-dnd-html5-backend';
import singleProcessingStore from '../../singleProcessingStore';

/**
 * Renders a list of questions (`AnalysisQuestionRow`s to be precise).
 *
 * Also handles questions reordering (configured in `AnalysisQuestionRow`).
 */
export default function AnalysisQuestionsList() {
  const analysisQuestions = useContext(AnalysisQuestionsContext);
  if (!analysisQuestions) {
    return null;
  }

  // We only want to display analysis questions for this survey question
  const filteredQuestions = analysisQuestions.state.questions.filter(
    (question) => question.qpath === singleProcessingStore.currentQuestionQpath
  );

  const moveRow = useCallback(
    (uuid: string, oldIndex: number, newIndex: number) => {
      analysisQuestions.dispatch({
        type: 'reorderQuestion',
        payload: {uuid: uuid, oldIndex, newIndex},
      });
    },
    []
  );

  return (
    <DndProvider backend={HTML5Backend}>
      <ul className={styles.root}>
        {filteredQuestions.map((question, index: number) => {
          // TODO: we temporarily hide Keyword Search from the UI until
          // https://github.com/kobotoolbox/kpi/issues/4594 is done
          if (question.type === 'qual_auto_keyword_count') {
            return null;
          }

          // We hide questions marked as deleted
          if (question.options?.deleted) {
            return null;
          }

          return (
            <AnalysisQuestionRow
              uuid={question.uuid}
              index={index}
              key={question.uuid}
              moveRow={moveRow}
            />
          );
        })}
      </ul>
    </DndProvider>
  );
}
