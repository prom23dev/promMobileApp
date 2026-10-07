import React from 'react';
import { Linking, ScrollView, Text } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Header, Button } from '../src/ui/primitives';
import { PrivacyFooter } from '../src/ui/PrivacyControls';
import { layout, type } from '../src/ui/theme';
export default function Claims() {
 const router=useRouter();
 return <SafeAreaView style={layout.screen}><Header title="Претензии и обращения" back /><ScrollView style={layout.content} contentContainerStyle={{padding:18,gap:18,paddingBottom:40}}>
 <Text style={type.heading}>Обратитесь к продавцу</Text>
 <Text style={type.body}>Укажите номер заказа, имя, телефон или e-mail, опишите ситуацию и ваше требование. Если заказ оформлен у другого продавца, используйте его реквизиты из заказа и документов покупки.</Text>
 <Button label="Оформить обращение" onPress={()=>router.push('/forms/appeal?purpose=claim')} />
 <Button label="Написать на info@prom23.ru" variant="secondary" onPress={()=>{void Linking.openURL('mailto:info@prom23.ru?subject='+encodeURIComponent('Претензия по заказу'))}} />
 <Text style={type.subheading}>Почтовый адрес ООО «Промышленник»</Text><Text selectable style={type.body}>350058, Краснодарский край, г. Краснодар, ул. Селезнева, д. 201, оф. 5</Text>
 <Text style={type.body}>Прикладывайте только материалы, необходимые для рассмотрения обращения. Отсутствие кассового чека не исключает другие доказательства покупки.</Text>
 <Button label="Возврат товара" variant="secondary" onPress={()=>router.push('/pages/returns')} /><Button label="Гарантийное обслуживание" variant="secondary" onPress={()=>router.push('/pages/warranty')} />
 <PrivacyFooter />
 </ScrollView></SafeAreaView>;
}
