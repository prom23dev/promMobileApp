import React from 'react';
import {useLocalSearchParams} from 'expo-router';
import FormScreen from './FormScreen';
import FranchiseFormScreen from './FranchiseFormScreen';
import CheckoutScreen from './CheckoutScreen';
export default function FormRoute(){const {id}=useLocalSearchParams<{id:string}>();return (id==='partner'||id==='franchise')?<FranchiseFormScreen/>:id==='checkout'?<CheckoutScreen/>:<FormScreen/>;}
