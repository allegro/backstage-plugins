import React, { MouseEventHandler, useEffect, useRef, useState } from 'react';
import { alertApiRef, useApiHolder } from '@backstage/core-plugin-api';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import DialogActions from '@mui/material/DialogActions';
import IconButton from '@mui/material/IconButton';
import Popover from '@mui/material/Popover';
import { makeStyles, Theme } from '@material-ui/core';
import useMediaQuery from '@mui/material/useMediaQuery';
import { ChatIcon, MarkdownContent } from '@backstage/core-components';
import SendIcon from '@material-ui/icons/Send';
import { chatApiRef, HistoryItem, HistoryItemSource } from '../../alpha/apis';
import DialogTitle from '@mui/material/DialogTitle';
import DialogContent from '@mui/material/DialogContent';
import Grid from '@mui/material/Grid';
import List from '@mui/material/List';
import ListItemText from '@mui/material/ListItemText';
import Divider from '@mui/material/Divider';
import TextField from '@mui/material/TextField';
import Fab from '@mui/material/Fab';

export type ChatButtonProps = {
  title?: string;
};

export type ChatButtonClassKey = 'popoverList';

const useStyles = makeStyles<Theme>(theme => ({
  messageArea: {
    height: '30vh',
    overflowY: 'auto',
  },
  botAnswer: {
    textAlign: 'left',
    margin: 0,
    color: theme.palette.textSubtle,

    '& p': {
      margin: 0,
      padding: 0,
      marginBottom: 5,
    },
  },

  answerMeta: {
    fontSize: '0.9em',
  },
  personQuestion: {
    textAlign: 'right',
    margin: 0,
    '& p': {
      margin: 0,
      padding: 0,
      marginBottom: 5,
    },
  },
}));

export function ChatButton(props: ChatButtonProps) {
  const apis = useApiHolder();
  const { title } = props;
  const chatApi = apis.get(chatApiRef);
  const alertApi = apis.get(alertApiRef);
  const [popoverOpen, setPopoverOpen] = useState(false);
  const [busy, setBusy] = useState(false);

  const [questionHasError, setQuestionHasError] = useState(false);

  const [history, setHistory] = useState(Array<HistoryItem>);
  const [question, setQuestion] = useState('');
  const [anchorEl, setAnchorEl] = useState<Element | null>(null);
  const classes = useStyles();
  const endOfMessagesRef = useRef<null | HTMLDivElement>(null);
  const isSmallScreen = useMediaQuery<Theme>(theme =>
    theme.breakpoints.down('md'),
  );

  const onClickHandler: MouseEventHandler = event => {
    setAnchorEl(event.currentTarget);
    setPopoverOpen(true);
  };

  const popoverCloseHandler = () => {
    setPopoverOpen(false);
  };

  const sendHandler = () => {
    if (question.length < 10) {
      setQuestionHasError(true);
      return;
    }

    setQuestionHasError(false);

    setBusy(true);
    const questionValue = question;
    setHistory([
      ...history,
      {
        content: questionValue,
        itemDate: new Date(Date.now()),
        source: HistoryItemSource.Person,
      },
      {
        content: `...`,
        itemDate: new Date(Date.now()),
        source: HistoryItemSource.Bot,
      },
    ]);

    setQuestion('');

    chatApi
      ?.prompt({ content: question })
      .then(_ => {
        const newHistory = chatApi.getHistory();

        setHistory(newHistory);
        setBusy(false);
      })
      .catch(error => {
        alertApi?.post({
          message: error,
          display: 'permanent',
          severity: 'error',
        });

        throw error;
      });
  };

  const handleChange = (event: any) => {
    setQuestion(event.target.value);
  };

  const handleKeyDown = (event: any) => {
    if (event.key === 'Enter') {
      sendHandler();
    }
  };

  useEffect(() => {
    // Scroll to the bottom of the messages when messages change
    if (endOfMessagesRef.current) {
      endOfMessagesRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [history]);

  return (
    <>
      <Box
        display="flex"
        ml={1}
        sx={{ position: 'fixed', bottom: 0, right: 0 }}
      >
        <IconButton
          color="primary"
          size="medium"
          onClick={onClickHandler}
          data-testid="chat-button"
          aria-label="Chat with assistant"
        >
          <ChatIcon fontSize="large" />
        </IconButton>
      </Box>
      <Popover
        data-testid="chat-button-popover"
        open={popoverOpen}
        anchorEl={anchorEl}
        anchorOrigin={{
          vertical: 'bottom',
          horizontal: 'right',
        }}
        transformOrigin={{
          vertical: 'top',
          horizontal: 'right',
        }}
        onClose={() => undefined}
        PaperProps={{
          style: {
            width: isSmallScreen ? '100vw' : '30vw',
          },
        }}
      >
        <DialogTitle>{title ? title : 'Backstage Assistant'}</DialogTitle>
        <DialogContent>
          <Grid item xs={12}>
            <List className={classes.messageArea}>
              {history.map((item: HistoryItem, i) => {
                const itemClass =
                  item.source === HistoryItemSource.Bot
                    ? classes.botAnswer
                    : classes.personQuestion;

                return (
                  <Box key={`child-${i}`} style={{ marginBottom: 10 }}>
                    <MarkdownContent
                      className={itemClass}
                      content={item.content}
                    />
                    <ListItemText
                      className={itemClass}
                      secondary={item.itemDate.toLocaleTimeString()}
                      classes={{ secondary: classes.answerMeta }}
                    />
                  </Box>
                );
              })}
              <div ref={endOfMessagesRef} />
            </List>
            <Divider />
            <Grid container style={{ padding: '10px' }}>
              <Grid item xs={11}>
                <TextField
                  variant="standard"
                  id="outlined-basic-email"
                  label="How can I help?"
                  fullWidth
                  value={question}
                  onChange={handleChange}
                  onKeyDown={handleKeyDown}
                  disabled={busy}
                  required
                  helperText="At least 10 characters"
                  error={questionHasError}
                />
              </Grid>
              <Grid item xs={1}>
                <Fab
                  color="primary"
                  aria-label="add"
                  onClick={sendHandler}
                  disabled={busy}
                >
                  <SendIcon />
                </Fab>
              </Grid>
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button
            color="primary"
            onClick={popoverCloseHandler}
            aria-label="Close"
          >
            Close
          </Button>
        </DialogActions>
      </Popover>
    </>
  );
}
