import dateFormat from 'dateformat'
import { History } from 'history'
import update from 'immutability-helper'
import { type } from 'os'
import * as React from 'react'
import {
  Button,
  Checkbox,
  Divider,
  Grid,
  Header,
  Icon,
  Input,
  Image,
  Loader,
  Dropdown,
  Form,
  DropdownProps,
  Label,
  Item
} from 'semantic-ui-react'

import { createTodo, deleteTodo, getTodos, patchTodo } from '../api/todos-api'
import Auth from '../auth/Auth'
import { Todo } from '../types/Todo'

const rqname = 'Please enter a task name!'
const rqpriority = 'Please select a priority of task!'
const rqstatus = 'Please select a status of task!'


const optionsPriority = [
  { key: 1, text: 'Urgent and important', value: "Urgent and important" },
  { key: 2, text: 'Important, but not urgent', value: 'Important, but not urgent' },
  { key: 3, text: 'Urgent, but not important', value: 'Urgent, but not important' },
  { key: 4, text: 'Neither urgent nor important', value: 'Neither urgent nor important' },
]

const optionsStatus = [
  { key: 1, text: 'Define', value: 'Define' },
  { key: 2, text: 'Inprogress', value: 'Inprogress' },
  { key: 3, text: 'Done', value: 'Done' },
]

interface TodosProps {
  auth: Auth
  history: History
}

interface TodosState {
  todos: Todo[]
  newTodoName: string
  loadingTodos: boolean
  priority?: string
  status?: string,

  rquireName: string,
  rquirePriority: string,
  rquireStatus: string

}

export class Todos extends React.PureComponent<TodosProps, TodosState> {
  state: TodosState = {
    todos: [],
    newTodoName: '',
    loadingTodos: true,
    priority: '',
    status: '',

    rquireName: '',
    rquirePriority: '',
    rquireStatus: ''
  }

  handleNameChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    this.setState({ newTodoName: event.target.value, rquireName: event.target.value.trim() === '' ? rqname : '' })
  }
  handlePriorityChange = (event: React.SyntheticEvent<HTMLElement, Event>, data: DropdownProps) => {
    this.setState({ priority: data.value?.toString(), rquirePriority: data.value?.toString() === '' ? rqpriority : '' })
  }
  handleStatusChange = (event: React.SyntheticEvent<HTMLElement, Event>, data: DropdownProps) => {
    this.setState({ status: data.value?.toString(), rquireStatus: data.value?.toString() === '' ? rqstatus : '' })
  }

  onEditButtonClick = (todoId: string) => {
    this.props.history.push(`/todos/${todoId}/edit`)
  }

  onTodoCreate = async (event: React.MouseEvent<HTMLButtonElement, MouseEvent>, data: any) => {
    try {
      console.log("abc d")
      const dueDate = this.calculateDueDate()
      const priority = this.state.priority?.toString()
      const status = this.state.status?.toString()
      this.setState({ rquireName: '', rquirePriority: '', rquireStatus: '' })
      let hasRequired = false
      if (this.state.newTodoName.trim() == '') {
        hasRequired = true
        this.setState({ rquireName: rqname })
      }
      if (this.state.status?.trim() == '') {
        hasRequired = true
        this.setState({ rquireStatus: rqstatus })
      }
      if (this.state.priority?.trim() == '') {
        hasRequired = true
        this.setState({ rquirePriority: rqpriority })
      }
      if (!hasRequired) {
        const newTodo = await createTodo(this.props.auth.getIdToken(), {
          name: this.state.newTodoName,
          dueDate,
          priority: priority,
          status: status
        })
        alert('Todo creation successful')
        this.setState({
          todos: [...this.state.todos, newTodo],
          newTodoName: ''
        })
      }
    } catch (e) {
      alert('Todo creation failed')
    }
  }

  onTodoDelete = async (todoId: string) => {
    try {
      await deleteTodo(this.props.auth.getIdToken(), todoId)
      this.setState({
        todos: this.state.todos.filter(todo => todo.todoId !== todoId)
      })
    } catch {
      alert('Todo deletion failed')
    }
  }

  onTodoCheck = async (pos: number) => {
    try {
      const todo = this.state.todos[pos]
      await patchTodo(this.props.auth.getIdToken(), todo.todoId, {
        name: todo.name,
        dueDate: todo.dueDate,
        done: !todo.done,
        priority: todo.priority,
        status: todo.status
      })
      this.setState({
        todos: update(this.state.todos, {
          [pos]: { done: { $set: !todo.done } }
        })
      })
    } catch {
      alert('Todo deletion failed')
    }
  }

  async componentDidMount() {
    try {
      const todos = await getTodos(this.props.auth.getIdToken())
      this.setState({
        todos,
        loadingTodos: false
      })
    } catch (e) {
      alert(`Failed to fetch todos: ${e}`)
    }
  }

  render() {
    return (
      <div>
        <Header as="h1">Manage Tasks</Header>

        {this.renderCreateTodoInput()}

        {this.renderTodos()}
      </div>
    )
  }

  renderCreateTodoInput() {
    return (
      <Grid.Row>
        <Grid.Column width={16}>
          <label><b>Task Name</b></label>
          <Form.Field>
            <Input
              fluid
              placeholder="Enter a task name for future..."
              onChange={this.handleNameChange}
              value={this.state.newTodoName} 
            />
            <Label basic color='red' pointing className={this.state.rquireName === '' ? 'displaynone' : ""}>
              {this.state.rquireName}
            </Label>
          </Form.Field>
        </Grid.Column>

        <Grid.Column>
          <label><b>Priority Of Task</b></label>
          <Form.Field>
            <Dropdown
              selectOnNavigation={false}
              className="ui primary"
              onChange={this.handlePriorityChange}
              clearable
              options={optionsPriority}
              selection
              placeholder='Select Priority'
              fluid
            />
            <Label basic color='red' pointing className={this.state.rquirePriority === '' ? 'displaynone' : ""}>
              {this.state.rquirePriority}
            </Label>
          </Form.Field>
        </Grid.Column>
        <Grid.Column>
          <label><b>Status Of Task</b></label>
          <Form.Field>
            <Dropdown
              selectOnNavigation={false}
              clearable
              className="ui primary"
              options={optionsStatus}
              selection
              placeholder='Select Status'
              fluid
              onChange={this.handleStatusChange} />
            <Label basic color='red' pointing className={this.state.rquireStatus === '' ? 'displaynone' : ""}>
              {this.state.rquireStatus}
            </Label>
          </Form.Field>
        </Grid.Column>
        <Grid.Column width={16}>
          <Divider />
          <Button icon='add' color='teal' content='Add new task' onClick={this.onTodoCreate} />
          <Divider />
        </Grid.Column>
      </Grid.Row>
    )
  }

  renderTodos() {
    if (this.state.loadingTodos) {
      return this.renderLoading()
    }

    return this.renderTodosList()
  }

  renderLoading() {
    return (
      <Grid.Row>
        <Loader indeterminate active inline="centered">
          Loading TODOs
        </Loader>
      </Grid.Row>
    )
  }

  renderTodosList() {
    return (
        <Item.Group divided>
        <h2>List of task</h2>
        {this.state.todos.map((todo, pos) => {
            return(
          <Item>
            {todo.attachmentUrl && (
              <Item.Image src={todo.attachmentUrl} size="small" />
            )}
            <Item.Content>
              <Item.Header as='a'>{todo.name}</Item.Header>
              <Item.Meta>
                <span className='cinema'>{todo.dueDate}</span>
              </Item.Meta>
              <Item.Description>Complete the task for future</Item.Description>
              <Item.Extra>
                <Checkbox
                      onChange={() => this.onTodoCheck(pos)}
                      checked={todo.done}
                      label={todo.done? 'Done' : todo.status}
                    />
                <Label>Status Of Task: {todo.status}</Label>
                <Label>Priority Of Task: {todo.priority}</Label>
                <Button
                  floated='right'
                  icon
                  color="red"
                  onClick={() => this.onTodoDelete(todo.todoId)}
                >
                  <Icon name="delete" />
                </Button>
                <Button
                    floated='right'
                    icon
                    color="blue"
                    onClick={() => this.onEditButtonClick(todo.todoId)}
                  >
                    <Icon name="pencil" />
                </Button>
              </Item.Extra>
            </Item.Content>
        </Item>
        )
        })}
    </Item.Group>
    )
  }

  calculateDueDate(): string {
    const date = new Date()
    date.setDate(date.getDate() + 7)

    return dateFormat(date, 'yyyy-mm-dd') as string
  }
}
