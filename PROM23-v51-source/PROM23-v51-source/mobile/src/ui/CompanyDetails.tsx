import React, { useState } from 'react';
import { Linking, Platform, Text, View } from 'react-native';
import { Download, Mail, Phone } from 'lucide-react-native';
import type { SitePage } from '../content/sitePages';
import { Button } from './primitives';
import { colors, layout, type } from './theme';

export function CompanyDetails({ page }: { page: SitePage }) {
  const [error, setError] = useState('');
  async function open(url: string) { setError(''); try { await Linking.openURL(url); } catch { setError('Не удалось открыть. Повторите попытку.'); } }
  function download() {
    const path = '/documents/prom23-requisites.docx';
    if (Platform.OS === 'web') {
      const link = document.createElement('a'); link.href = path; link.download = 'Реквизиты Промышленник.docx'; document.body.appendChild(link); link.click(); link.remove();
    } else void open(new URL(path, process.env.EXPO_PUBLIC_LOCAL_API_URL || 'http://127.0.0.1:8087').href);
  }
  const paragraphs = page.sections.flatMap(section => section.paragraphs);
  return <View style={{ gap: 16 }}><View style={layout.card}>
    {paragraphs.map((text, index) => {
      const email = text.match(/[\w.+-]+@[\w.-]+\.[a-z]{2,}/i)?.[0];
      if (email) return <Button key={index} label={email} icon={<Mail color={colors.brand} size={20} />} variant="secondary" onPress={() => { void open('mailto:'+email); }} />;
      if (text.startsWith('Телефон:')) { const number = text.replace(/\D/g, '').replace(/^8/, '7'); return <Button key={index} label={text.replace('Телефон: ', '')} icon={<Phone color={colors.brand} size={20} />} variant="secondary" onPress={() => { void open('tel:+'+number); }} />; }
      return <Text key={index} selectable style={index === 0 ? type.heading : text.startsWith('Примечание') ? type.caption : type.body}>{text.replace(/^Примечание /,'')}</Text>;
    })}
  </View><Button label="Скачать реквизиты в Word" icon={<Download color={colors.white} size={20} />} onPress={download} /><Text style={type.caption}>DOCX · можно сохранить и передать в бухгалтерию</Text>{!!error && <Text accessibilityRole="alert" style={type.body}>{error}</Text>}</View>;
}
