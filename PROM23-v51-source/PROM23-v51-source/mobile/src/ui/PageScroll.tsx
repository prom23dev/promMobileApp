import React, { forwardRef, type ReactElement, type Ref } from 'react';
import { ScrollView as NativeScrollView, FlatList as NativeFlatList, View, type ScrollViewProps, type FlatListProps } from 'react-native';
import { BuyerContextSwitch } from './BuyerContextSwitch';
import { colors } from './theme';

// Buyer controls belong to the page content, never the sticky header.
// Native scrolling handles hiding, restoration and accessibility without resize loops.
function BuyerControls() {
  return <View testID="page-buyer-controls" style={{ paddingHorizontal: 12, paddingVertical: 8, backgroundColor: colors.white, borderBottomWidth: 1, borderBottomColor: colors.line }}><BuyerContextSwitch compact /></View>;
}
export type ScrollView = NativeScrollView;
export const ScrollView = forwardRef<NativeScrollView, ScrollViewProps & { buyerControls?: boolean }>(function PageScrollView({ buyerControls = false, children, ...props }, ref) {
  return <NativeScrollView {...props} ref={ref}>{buyerControls && <BuyerControls />}{children}</NativeScrollView>;
});
export type FlatList<T> = NativeFlatList<T>;
function PageFlatList<T>({ buyerControls = false, ListHeaderComponent, ...props }: FlatListProps<T> & { buyerControls?: boolean }, ref: Ref<NativeFlatList<T>>) {
  const header = React.isValidElement(ListHeaderComponent) ? ListHeaderComponent : ListHeaderComponent ? React.createElement(ListHeaderComponent) : null;
  return <NativeFlatList {...props} ref={ref} ListHeaderComponent={buyerControls ? <><BuyerControls />{header}</> : ListHeaderComponent} />;
}
export const FlatList = forwardRef(PageFlatList) as <T>(props: FlatListProps<T> & { buyerControls?: boolean; ref?: Ref<NativeFlatList<T>> }) => ReactElement;
