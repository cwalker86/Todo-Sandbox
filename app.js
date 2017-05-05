/* The Default App Component */

import React, { Component } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ActivityIndicator,
  Platform,
  ListView,
  Keyboard,
  AsyncStorage
} from 'react-native';
import Header from "./header";
import Footer from "./footer";
import Row from "./row";

const filterItems = (filter, items) => {
  return items.filter((item) => {
    if (filter === "ALL") return true;
    if (filter === "COMPLETED") return item.complete;
    if (filter === "ACTIVE") return !item.complete;
  })
}

export default class App extends Component {
  constructor(props) {
    super(props);
    // Helps the ListView render efficently.
    const ds = new ListView.DataSource({rowHasChanged: (r1, r2) => r1 !== r2});
    this.state = {
      // loading flag
      loading: true,
      // Hold value for text input
      value: "",
      items: [],
      // Keep track of the current completion status
      allComplete: false,
      dataSource: ds.cloneWithRows([]),
      // Default Status of the filter.
      filter: "ALL"
    }
    this.handleUpdateText = this.handleUpdateText.bind(this);
    this.handleToggleEditing = this.handleToggleEditing.bind(this);
    this.handleFilter = this.handleFilter.bind(this);
    this.handleRemoveItem = this.handleRemoveItem.bind(this);
    this.handleAddItem = this.handleAddItem.bind(this);
    this.handleToggleAllComplete = this.handleToggleAllComplete.bind(this);
    this.handleToggleComplete = this.handleToggleComplete.bind(this);
    this.setSource = this.setSource.bind(this);
    this.handleClearComplete = this.handleClearComplete.bind(this);
  }
  componentWillMount() {
      AsyncStorage.getItem("items").then((json) => {
        try {
          const items = JSON.parse(json);
          this.setSource(items, items, { loading: false });
        } catch(e) {
          this.setState({
            loading: false
          })
        }
      })
  }
  setSource(items, itemsDataSource, otherState = {}) {
    this.setState({
      items,
      dataSource: this.state.dataSource.cloneWithRows(itemsDataSource),
      ...otherState
    })
    // After state is updated, store items locally passed in using AsyncStorage
    AsyncStorage.setItem("items", JSON.stringify(items));
  }
  handleUpdateText(key, text) {
    // Map state of items into New Items
    const newItems = this.state.items.map((item) => {
      // With each item, if the item.key does not match key passed, return item.
      if (item.key !== key) return item;
      // Otherwise spread into new object
      return {
        ... item,
        text
      }
    })
    // Set the source of the newly updated items list
    this.setSource(newItems, filterItems(this.state.filter, newItems))
  }
  handleToggleEditing(key, editing) {
    // Map state of items into New Items
    const newItems = this.state.items.map((item) => {
      // With each item, if the item.key does not match key passed, return item.
      if (item.key !== key) return item;
      // Otherwise spread into new object
      return {
        ... item,
        editing
      }
    })
    // Set the source of the newly updated items list
    this.setSource(newItems, filterItems(this.state.filter, newItems))
  }
  handleClearComplete() {
    const newItems = filterItems("ACTIVE", this.state.items);
    this.setSource(newItems, filterItems(this.state.filter, newItems));
  }
  handleFilter(filter) {
    this.setSource(this.state.items, filterItems(filter, this.state.items), { filter })
  }
  handleRemoveItem(key) {
    const newItems = this.state.items.filter((item) => {
      return item.key !== key
    })
    this.setSource(newItems, filterItems(this.state.filter, newItems ));
  }
  handleToggleComplete(key, complete) {
    const newItems = this.state.items.map((item) => {
      // if item.key doesn't return the item we are looking for, return the old item.
      if (item.key !== key) return item;
      return {
        ...item,
        complete
      }
    })
    this.setSource(newItems, filterItems(this.state.filter, newItems ));
  }
  handleToggleAllComplete() {
    const complete = !this.state.allComplete;
    const newItems = this.state.items.map((item) => ({
      // Spread item into the new opbject
      ...item,
      // Set complete status that was toggled
      complete
    }))
    // console.table(newItems);
    this.setSource(newItems, filterItems(this.state.filter, newItems ), { allComplete: complete })
  }
  handleAddItem() {
    if(!this.state.value) return;
    const newItems = [
      ...this.state.items,
      {
        key: Date.now(),
        text: this.state.value,
        complete: false
      }
    ]
    // this.setSource replaces the setState here.
    this.setSource(newItems, filterItems(this.state.filter, newItems ), { value: "" })
  }
  render() {
    return (
      <View style={styles.container}>
        <Header
          value={this.state.value}
          onAddItem={this.handleAddItem}
          onChange={(value) => this.setState({ value })}
          onToggleAllComplete={this.handleToggleAllComplete}
        />
        <View style={styles.content}>
          <ListView
          style={styles.list}
            enableEmptySections
            dataSource={this.state.dataSource}
            onScroll={() => Keyboard.dismiss()}
            renderRow={({ key, ...value}) => {
              return (
                <Row
                  key={key}
                  onUpdate={(text) => this.handleUpdateText(key, text)}
                  onToggleEdit={(editing) => this.handleToggleEditing(key, editing)}
                  onRemove={() => this.handleRemoveItem(key)}
                  onComplete={(complete) => this.handleToggleComplete(key, complete)}
                  {...value}
                />
              )
            }}
            renderSeparator={(sectionId, rowId) => {
              return <View key={rowId} style={styles.seperator} />
            }}
          />
        </View>
        <Footer
          count={filterItems("ACTIVE", this.state.items).length }
          onFilter={this.handleFilter}
          filter={this.state.filter}
          onClearComplete={this.handleClearComplete}
        />
        {
          // if this.state.loading is true, display the ActivityIndicator
          this.state.loading &&
          <View style={styles.loading}>
            <ActivityIndicator
              animating
              size="large"
            />
          </View>
        }
      </View>
    );
  }
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F5F5F5",
    ...Platform.select({
      ios: { paddingTop: 30 }
    })
  },
  // Loader needs to cover everything!
  loading: {
    position: "absolute",
    left: 0,
    top: 0,
    right: 0,
    bottom: 0,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(0,0,0, .2)"
  },
  content: {
    flex: 1
  },
  list: {
    backgroundColor: '#FFF'
  },
  seperator: {
    borderWidth: 1,
    borderColor: "#F5F5F5"
  }
});
