import React, { useState, useEffect, useRef } from 'react';
import {
	SafeAreaView,
	FlatList,
	Text,
	TextInput,
	View,
	TouchableOpacity,
	Button,
	Alert,
	StyleSheet,
	StatusBar,
	Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import Clipboard from '@react-native-clipboard/clipboard';

const App = () => {
	const [items, setItems] = useState([]);
	const [inputValue, setInputValue] = useState('');
	const [isCountVisible, setIsCountVisible] = useState(false); // state to toggle count visibility
	const inputRef = useRef(null);

	useEffect(() => {
		const loadData = async () => {
			try {
				const savedItems = await AsyncStorage.getItem('clothItems');
				if (savedItems) setItems(JSON.parse(savedItems));
			} catch (error) {
				console.error('Failed to load items:', error);
			}
		};
		loadData();
	}, []);

	const saveData = async (newItems) => {
		try {
			await AsyncStorage.setItem('clothItems', JSON.stringify(newItems));
		} catch (error) {
			console.error('Failed to save items:', error);
		}
	};

	const addItem = () => {
		const id = inputValue.trim();
		if (!/^\d{3}$/.test(id))
			return Alert.alert('Error', 'Enter a valid 3-digit ID');
		if (items.some((item) => item.id === id))
			return Alert.alert('Error', 'ID already exists');

		const newItem = { id, checked: false };
		const updatedItems = [newItem, ...items];
		setItems(updatedItems);
		saveData(updatedItems);
		setInputValue('');
		inputRef.current?.focus();
	};

	const toggleCheck = (id) => {
		const updatedItems = items.map((item) =>
			item.id === id ? { ...item, checked: !item.checked } : item,
		);
		setItems(updatedItems);
		saveData(updatedItems);
	};

	const deleteItem = (id) => {
		const updatedItems = items.filter((item) => item.id !== id);
		setItems(updatedItems);
		saveData(updatedItems);
	};

	const clearCheckedItems = () => {
		const updatedItems = items.filter((item) => !item.checked);
		setItems(updatedItems);
		saveData(updatedItems);
	};

	const clearUncheckedItems = () => {
		const updatedItems = items.filter((item) => item.checked);
		setItems(updatedItems);
		saveData(updatedItems);
	};

	const clearList = () => {
		Alert.alert('Clear', 'Clear checked or unchecked items?', [
			{ text: 'Cancel', style: 'cancel' },
			{ text: 'Checked', onPress: clearCheckedItems },
			{ text: 'Unchecked', onPress: clearUncheckedItems },
		]);
	};

	const deleteItemAlert = (id) => {
		Alert.alert('Delete', 'Are you sure?', [
			{ text: 'Cancel', style: 'cancel' },
			{ text: 'Yes', onPress: () => deleteItem(id) },
		]);
	};

	const copyItemsToClipboard = (type) => {
		const filteredItems = items.filter((item) => item.checked === type);
		const itemList = filteredItems.map((item) => item.id).join(', ');

		if (itemList) {
			Clipboard.setString(itemList);
			Alert.alert(
				'Copied',
				`${type ? 'Checked' : 'Unchecked'} items copied`,
			);
		} else {
			Alert.alert(
				'No items',
				`No ${type ? 'checked' : 'unchecked'} items to copy`,
			);
		}
	};

	const copyItems = () => {
		Alert.alert('Copy', 'Copy checked or unchecked items?', [
			{ text: 'Cancel', style: 'cancel' },
			{ text: 'Checked', onPress: () => copyItemsToClipboard(true) },
			{ text: 'Unchecked', onPress: () => copyItemsToClipboard(false) },
		]);
	};

	const checkedCount = items.filter((item) => item.checked).length;
	const uncheckedCount = items.filter((item) => !item.checked).length;
	const totalCount = items.length;

	return (
		<SafeAreaView style={styles.safeAreaView}>
			<TextInput
				ref={inputRef}
				style={styles.textInput}
				placeholder='Enter Cloth ID'
				value={inputValue}
				onChangeText={setInputValue}
				keyboardType='numeric'
				onSubmitEditing={addItem}
			/>
			<FlatList
				data={items}
				keyExtractor={(item) => item.id}
				renderItem={({ item }) => (
					<View style={styles.card}>
						<TouchableOpacity onPress={() => toggleCheck(item.id)}>
							<Ionicons
								name={
									item.checked ? 'checkbox' : 'square-outline'
								}
								size={24}
								color='blue'
							/>
						</TouchableOpacity>
						<Text style={styles.iDText}>{item.id}</Text>
						<TouchableOpacity
							onPress={() => deleteItemAlert(item.id)}
						>
							<Ionicons name='trash' size={24} color='red' />
						</TouchableOpacity>
					</View>
				)}
			/>
			{/* Count Info Card - Conditionally Rendered */}
			{isCountVisible && (
				<View style={styles.totalContainer}>
					<View style={styles.totalItem}>
						<Text style={styles.totalText}>Total</Text>
						<Text style={styles.totalValue}>{totalCount}</Text>
					</View>
					<View style={styles.totalItem}>
						<Text style={[styles.totalText, styles.checkedText]}>
							Checked
						</Text>
						<Text style={[styles.totalValue, styles.checkedValue]}>
							{checkedCount}
						</Text>
					</View>
					<View style={styles.totalItem}>
						<Text style={[styles.totalText, styles.uncheckedText]}>
							Unchecked
						</Text>
						<Text
							style={[styles.totalValue, styles.uncheckedValue]}
						>
							{uncheckedCount}
						</Text>
					</View>
				</View>
			)}
			<View style={styles.button}>
				<Button title='Copy' onPress={copyItems} />
				<Button title='Clear' color='red' onPress={clearList} />
			</View>
			{!isCountVisible && (
				<TouchableOpacity style={styles.addBtn} onPress={addItem}>
					<Ionicons name='add' size={24} color='white' />
				</TouchableOpacity>
			)}
			{/* Button to toggle the visibility of the count info card */}
			<TouchableOpacity
				style={styles.toggleButton}
				onPress={() => setIsCountVisible((prev) => !prev)}
			>
				<Text style={styles.toggleButtonText}>
					{isCountVisible ? 'Hide Count' : 'Show Count'}
				</Text>
			</TouchableOpacity>
		</SafeAreaView>
	);
};

const styles = StyleSheet.create({
	safeAreaView: {
		flex: 1,
		backgroundColor: '#f5f5f5',
		paddingTop: Platform.OS === 'android' ? StatusBar.currentHeight : 0,
	},
	textInput: {
		borderWidth: 1,
		borderColor: '#ccc',
		borderRadius: 8,
		padding: 8,
		margin: 10,
		marginBottom: 10,
		backgroundColor: '#fff',
	},
	card: {
		flexDirection: 'row',
		alignItems: 'center',
		justifyContent: 'space-between',
		padding: 8,
		backgroundColor: '#fff',
		borderRadius: 8,
		marginBottom: 5,
		marginHorizontal: 10,
	},
	button: {
		flexDirection: 'row',
		justifyContent: 'space-around',
		marginTop: 10,
	},
	totalContainer: {
		flexDirection: 'row',
		justifyContent: 'space-around',
		marginTop: 15,
		padding: 15,
		backgroundColor: '#ffffff',
		borderRadius: 10,
		marginHorizontal: 10,
		shadowColor: '#000',
		shadowOffset: { width: 0, height: 2 },
		shadowOpacity: 0.2,
		shadowRadius: 5,
		elevation: 3, // For Android
	},
	totalItem: {
		justifyContent: 'center',
		alignItems: 'center',
	},
	totalText: {
		fontSize: 18,
		fontWeight: 'bold',
		color: '#333',
		marginBottom: 5,
	},
	totalValue: {
		fontSize: 22,
		fontWeight: 'bold',
	},
	checkedText: {
		color: '#4CAF50', // Green for checked
	},
	uncheckedText: {
		color: '#FF5722', // Red for unchecked
	},
	checkedValue: {
		color: '#4CAF50', // Green for checked count
	},
	uncheckedValue: {
		color: '#FF5722', // Red for unchecked count
	},
	iDText: {
		flex: 1,
		marginLeft: 10,
		fontWeight: 'bold',
		fontStyle: 'italic',
	},
	addBtn: {
		position: 'absolute',
		right: 40,
		bottom: 320,
		backgroundColor: 'blue',
		borderRadius: 50,
		padding: 16,
		elevation: 4,
	},
	toggleButton: {
		backgroundColor: 'blue',
		borderRadius: 8,
		marginTop: 10,
		marginHorizontal: 10,
		alignItems: 'center',
		padding: 8,
	},
	toggleButtonText: {
		color: 'white',
		fontSize: 16,
		fontWeight: 'bold',
	},
});

export default App;
