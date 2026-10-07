import { rutubeChannel } from '../video-source';
import { PrivacyFooter } from '../ui/PrivacyControls';
import React from 'react';
import { Linking, Pressable, Text, View } from 'react-native';
import { ScrollView } from '../ui/PageScroll';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter, type Href } from 'expo-router';
import { Mail, Phone } from 'lucide-react-native';
import { Button, Header, Sheet } from '../ui/primitives';
import { MenuRow } from '../ui/MenuRow';
import { siteContacts, supportPhone, supportPhoneLabel } from '../content/siteContent';
import { navigationMenu } from '../navigation-menu';
import { colors, layout, type } from '../ui/theme';
export default function MoreScreen() {
  const router = useRouter();
  const [callError, setCallError] = React.useState(false);
  const [writeOpen, setWriteOpen] = React.useState(false);
  const email = siteContacts['Краснодар'].email!;
  return <SafeAreaView style={layout.screen} edges={['top', 'left', 'right']}>
    <Header title="Меню" back showCall={false} />
    <ScrollView testID="global-menu-scroll" style={layout.content} contentContainerStyle={{ padding: 16, gap: 22, paddingBottom: 24 }}>
      <View style={{ flexDirection: 'row', gap: 10 }}>
        <Button label="Позвонить" variant="secondary" icon={<Phone size={20} strokeWidth={1.7} color={colors.brand} accessible={false} aria-hidden />}
          onPress={() => { void Linking.openURL('tel:' + supportPhone).catch(() => setCallError(true)); }} style={{ flex: 1, minHeight: 48, paddingHorizontal: 12 }} />
        <Button label="Написать" variant="secondary" icon={<Mail size={20} strokeWidth={1.7} color={colors.brand} accessible={false} aria-hidden />} onPress={() => setWriteOpen(true)} style={{ flex: 1, minHeight: 48, paddingHorizontal: 12 }} />
      </View>
      {navigationMenu.map(group => <View key={group.title} style={{ gap: 10 }}>
        <Text accessibilityRole="header" aria-level={2} style={[type.caption, { color: colors.brand, fontWeight: '700', letterSpacing: 0.6, textTransform: 'uppercase', paddingLeft: 4 }]}>{group.title}</Text>
        <View style={{ borderRadius: 16, overflow: 'hidden', backgroundColor: colors.white }}>
          {group.entries.map((entry, index) => <MenuRow key={entry.route} entry={entry} last={index === group.entries.length - 1} onPress={() => router.push(entry.route as Href)} />)}
        </View>
      </View>)}
      <View style={{gap:10}}><Text style={type.subheading}>Мы в соцсетях</Text><View style={{flexDirection:'row',flexWrap:'wrap',gap:12}}>{[{name:'ВКонтакте',url:'https://vk.com/prom23ru'},{name:'RUTUBE',url:rutubeChannel},{name:'YouTube',url:'https://www.youtube.com/@prom23ru'},{name:'Telegram',url:'https://t.me/prom23ru'}].map(item=><Pressable key={item.name} accessibilityRole="link" accessibilityLabel={item.name+' — открыть'} onPress={()=>{void Linking.openURL(item.url)}} style={{minHeight:48,padding:12,borderRadius:12,backgroundColor:colors.white}}><Text style={type.label}>{item.name}</Text></Pressable>)}</View></View>
      <PrivacyFooter />
    </ScrollView>
    <Sheet visible={callError} onClose={() => setCallError(false)} title="Связаться с магазином"><Text selectable style={type.heading}>{supportPhoneLabel}</Text><Text style={type.body}>Наберите этот номер в приложении телефона.</Text><Button label="Закрыть" variant="secondary" onPress={() => setCallError(false)} /></Sheet>
    <Sheet visible={writeOpen} onClose={() => setWriteOpen(false)} title="Написать нам">
      <Text style={type.body}>Напишите ваш вопрос и оставьте контакт для ответа. Если вопрос о покупке, укажите номер заказа.</Text>
      <Text selectable style={type.subheading}>{email}</Text>
      <Button label="Написать по электронной почте" icon={<Mail size={20} color={colors.white} />} onPress={() => { void Linking.openURL('mailto:' + email).catch(() => {}); }} />
      <Text style={type.caption}>Если почтовое приложение не открылось, скопируйте адрес и отправьте письмо из вашей почты.</Text>
    </Sheet>
  </SafeAreaView>;
}
