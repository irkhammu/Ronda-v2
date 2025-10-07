import React, { useState, useEffect } from "react";
import {
  View, Text, TextInput, TouchableOpacity, FlatList, ScrollView, StyleSheet, Alert
} from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";

const STORAGE_KEY = "@ronda_data_v_final";
const daysOfWeek = ["Minggu", "Senin", "Selasa", "Rabu", "Kamis", "Jumat", "Sabtu"];
const monthNames = ["Januari","Februari","Maret","April","Mei","Juni","Juli","Agustus","September","Oktober","November","Desember"];

export default function App(){
  const today = new Date();
  const [view, setView] = useState("jadwal");
  const [petugasList, setPetugasList] = useState([]);
  const [nama, setNama] = useState("");
  const [bulan, setBulan] = useState(today.getMonth());
  const [tahun, setTahun] = useState(today.getFullYear());
  const [startIndex, setStartIndex] = useState(0);
  const [startRef, setStartRef] = useState({ year: tahun, month: bulan });

  useEffect(() => {
    (async () => {
      try {
        const raw = await AsyncStorage.getItem(STORAGE_KEY);
        if (raw) {
          const obj = JSON.parse(raw);
          if (obj.petugasList) setPetugasList(obj.petugasList);
          if (obj.startIndex !== undefined) setStartIndex(obj.startIndex);
          if (obj.startRef) setStartRef(obj.startRef);
        }
      } catch (e) {
        console.log("load err", e);
      }
    })();
  }, []);

  useEffect(() => {
    (async () => {
      try {
        await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify({
          petugasList, startIndex, startRef
        }));
      } catch (e) { console.log("save err", e); }
    })();
  }, [petugasList, startIndex, startRef]);

  function getCalendarCells(month, year){
    const firstDay = new Date(year, month, 1).getDay();
    const totalDays = new Date(year, month+1, 0).getDate();
    const totalCells = Math.ceil((firstDay + totalDays) / 7) * 7;
    const cells = [];
    for (let i = 0; i < totalCells; i++){
      const dateNumber = i - firstDay + 1;
      cells.push(dateNumber >= 1 && dateNumber <= totalDays ? dateNumber : null);
    }
    return cells;
  }

  function generateScheduleForMonth(month, year){
    if (petugasList.length === 0) return [];
    const n = petugasList.length;
    const startDate = new Date(startRef.year, startRef.month, 1);
    const targetDate = new Date(year, month, 1);
    const diffMs = targetDate - startDate;
    const diffDays = Math.round(diffMs / 86400000);
    const daysModulo = ((diffDays % n) + n) % n;
    const offset = (startIndex + daysModulo) % n;

    const daysInMonth = new Date(year, month+1, 0).getDate();
    const schedule = [];
    for (let d = 1; d <= daysInMonth; d++){
      const idx = (offset + (d - 1)) % n;
      schedule.push(petugasList[idx]);
    }
    return schedule;
  }

  const scheduleThisMonth = generateScheduleForMonth(bulan, tahun);
  const calendarCells = getCalendarCells(bulan, tahun);

  const addPetugas = () => {
    const v = nama.trim();
    if (!v) return;
    setPetugasList(prev => [...prev, v]);
    setNama("");
  };

  const deletePetugas = (i) => {
    Alert.alert("Hapus", `Hapus ${petugasList[i]} ?`, [
      { text: "Batal" },
      { text: "Hapus", onPress: () => {
        setPetugasList(prev => prev.filter((_, idx) => idx !== i));
        if (i < startIndex) setStartIndex(s => Math.max(0, s-1));
      }}
    ]);
  };

  const setStartTo = (index) => {
    setStartIndex(index);
    setStartRef({ year: tahun, month: bulan });
    Alert.alert("OK", `${petugasList[index]} di-set sebagai Start (referensi ${monthNames[bulan]} ${tahun})`);
  };

  const moveUp = (index) => {
    if (index === 0) return;
    const newList = [...petugasList];
    [newList[index - 1], newList[index]] = [newList[index], newList[index - 1]];
    setPetugasList(newList);
  };

  const moveDown = (index) => {
    if (index === petugasList.length - 1) return;
    const newList = [...petugasList];
    [newList[index], newList[index + 1]] = [newList[index + 1], newList[index]];
    setPetugasList(newList);
  };

  const prevMonth = () => {
    let m = bulan - 1;
    let y = tahun;
    if (m < 0) { m = 11; y = tahun - 1; }
    setBulan(m); setTahun(y);
  };

  const nextMonth = () => {
    let m = bulan + 1;
    let y = tahun;
    if (m > 11) { m = 0; y = tahun + 1; }
    setBulan(m); setTahun(y);
  };

  return (
    <View style={styles.container}>
      <Text style={styles.appTitle}>📅 Jadwal Ronda Blok F</Text>

      <View style={styles.menuRow}>
        <TouchableOpacity onPress={() => setView("jadwal")} style={[styles.menuBtn, view === "jadwal" && styles.menuActive]}>
          <Text style={styles.menuText}>Jadwal</Text>
        </TouchableOpacity>
        <TouchableOpacity onPress={() => setView("petugas")} style={[styles.menuBtn, view === "petugas" && styles.menuActive]}>
          <Text style={styles.menuText}>Petugas</Text>
        </TouchableOpacity>
      </View>

      {view === "jadwal" ? (
        <ScrollView style={{flex:1}} contentContainerStyle={{padding:10}}>
          <View style={styles.monthRow}>
            <TouchableOpacity onPress={prevMonth} style={styles.navBtn}><Text>◀</Text></TouchableOpacity>
            <Text style={styles.monthTitle}>{monthNames[bulan]} {tahun}</Text>
            <TouchableOpacity onPress={nextMonth} style={styles.navBtn}><Text>▶</Text></TouchableOpacity>
          </View>

          <View style={styles.weekRow}>
            {daysOfWeek.map((d,i) => <Text key={i} style={[styles.weekHeader, i===0 && {color:'red'}]}>{d}</Text>)}
          </View>

          <View style={styles.grid}>
            {calendarCells.map((cell, idx) => (
              <View key={idx} style={[styles.cell, (idx % 7) === 0 && styles.sundayCell]}>
                {cell ? (
                  <>
                    <Text style={styles.cellDate}>{cell}</Text>
                    <Text style={styles.cellName}>
                      {scheduleThisMonth[cell - 1] || "-"}
                    </Text>
                  </>
                ) : null}
              </View>
            ))}
          </View>

          <View style={{height:25}} />
          <Text style={styles.note}>Keterangan: </Text>
          <Text style={styles.note}>Penutupan Portal pada jam 21:00wib.</Text>
          <Text style={styles.note}>Petugas yang tidak Ronda wajib mengganti setoran Jimpitan Rp 15.000.</Text>
          <Text style={styles.note}>Petugas Ronda wajib mengisi list jimpitan harian yang kosong.</Text>
        </ScrollView>
      ) : (
        <ScrollView style={{flex:1}} contentContainerStyle={{padding:10}}>
          <Text style={styles.sectionTitle}>Kelola Petugas</Text>

          <View style={styles.row}>
            <TextInput
              placeholder="Nama petugas"
              placeholderTextColor="#666"
              value={nama}
              onChangeText={setNama}
              style={styles.input}
            />
            <TouchableOpacity onPress={addPetugas} style={styles.addBtn}><Text style={{color:'#fff'}}>Tambah</Text></TouchableOpacity>
          </View>

          <FlatList
            data={petugasList}
            keyExtractor={(_,i) => String(i)}
            renderItem={({item, index}) => (
              <View style={styles.petugasRow}>
                <Text style={{flex:1}}>{index+1}. {item}</Text>
                <TouchableOpacity onPress={() => moveUp(index)} style={styles.moveBtn}><Text>⬆️</Text></TouchableOpacity>
                <TouchableOpacity onPress={() => moveDown(index)} style={styles.moveBtn}><Text>⬇️</Text></TouchableOpacity>
                <TouchableOpacity onPress={() => setStartTo(index)} style={styles.startBtn}><Text>Set Start</Text></TouchableOpacity>
                <TouchableOpacity onPress={() => deletePetugas(index)} style={styles.deleteBtn}><Text style={{color:'#fff'}}>Hapus</Text></TouchableOpacity>
              </View>
            )}
          />

          <View style={{height:16}} />
          <Text style={{fontSize:13,color:'#444'}}>Cara set Start: tekan "Set Start" pada nama petugas — aplikasi menyimpan bulan/tahun saat itu sebagai referensi rotasi.</Text>
        </ScrollView>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex:1, backgroundColor:'#f0f4f8' },
  appTitle: { fontSize:18, fontWeight:'bold', textAlign:'center', padding:10 },
  menuRow: { flexDirection:'row', justifyContent:'center', marginBottom:6 },
  menuBtn: { padding:8, marginHorizontal:6, backgroundColor:'#cfd8e3', borderRadius:6 },
  menuActive: { backgroundColor:'#2b6fb3' },
  menuText: { color:'#fff', fontWeight:'700' },
  monthRow: { flexDirection:'row', justifyContent:'space-between', alignItems:'center', paddingHorizontal:12, marginBottom:6 },
  navBtn: { padding:6, backgroundColor:'#e6eef9', borderRadius:6 },
  monthTitle: { fontSize:16, fontWeight:'bold' },
  weekRow: { flexDirection:'row', paddingHorizontal:4 },
  weekHeader: { flex:1, textAlign:'center', fontWeight:'700', backgroundColor:'#dfeaf6', padding:6, borderWidth:1, borderColor:'#cfcfcf' },
  grid: { flexDirection:'row', flexWrap:'wrap', padding:4 },
  cell: { width:'14.28%', aspectRatio:1, borderWidth:1, borderColor:'#d0d7de', backgroundColor:'#fff', padding:4, alignItems:'center' },
  sundayCell: { backgroundColor:'#fff8f0' },
  cellDate: { fontWeight:'bold', color:'#333' },
  cellName: { fontSize:11, textAlign:'center', marginTop:6, color:'#0b3a66' },
  note: { textAlign:'left', padding:6, color:'#333' },
  sectionTitle: { fontSize:16, fontWeight:'700', marginBottom:10 },
  row: { flexDirection:'row', alignItems:'center', marginBottom:8, paddingHorizontal:2 },
  input: { flex:1, borderWidth:1, borderColor:'#bbb', borderRadius:6, padding:8, backgroundColor:'#fff', marginRight:8 },
  addBtn: { backgroundColor:'#2b6fb3', padding:10, borderRadius:6 },
  petugasRow: { flexDirection:'row', alignItems:'center', padding:8, backgroundColor:'#fff', marginBottom:6, borderRadius:6 },
  startBtn: { backgroundColor:'#9fc5f8', padding:6, borderRadius:6, marginHorizontal:3 },
  deleteBtn: { backgroundColor:'#f06262', padding:6, borderRadius:6 },
  moveBtn: { backgroundColor: '#d0e6a5', padding:6, borderRadius:6, marginHorizontal:3 }
});