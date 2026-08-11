'use client'
import { useState, useEffect } from 'react'
import supabase from '@/lib/supabaseClient'

export default function AdminPage() {
  const [price, setPrice] = useState('')
  const [name, setName] = useState('')
  const [categories, setCategories] = useState([])
  const [selectedCategory, setSelectedCategory] = useState('')
  const [cardCodes, setCardCodes] = useState('')
  
  // إعدادات شحناوي
  const [publicKey, setPublicKey] = useState('')
  const [secretKey, setSecretKey] = useState('')
  const [primaryIp, setPrimaryIp] = useState('')
  const [secondaryIp, setSecondaryIp] = useState('')

  useEffect(() => {
    fetchCategories()
    fetchSettings()
  }, [])

  const fetchCategories = async () => {
    const { data } = await supabase.from('categories').select('*')
    setCategories(data || [])
  }

  const fetchSettings = async () => {
    const { data } = await supabase.from('settings').select('*').single()
    if (data) {
      setPublicKey(data.public_key || '')
      setSecretKey(data.secret_key || '')
      setPrimaryIp(data.primary_ip || '')
      setSecondaryIp(data.secondary_ip || '')
    }
  }

  // إضافة فئة كروت
  const handleAddCategory = async (e) => {
    e.preventDefault()
    await supabase.from('categories').insert([{ name, price: parseFloat(price) }])
    setName('')
    setPrice('')
    fetchCategories()
    alert('تم إضافة الفئة بنجاح!')
  }

  // إضافة أكواد الكروت
  const handleAddCards = async (e) => {
    e.preventDefault()
    const codesArray = cardCodes.split('\n').filter(c => c.trim() !== '')
    const cardsToInsert = codesArray.map(code => ({
      category_id: selectedCategory,
      card_code: code.trim()
    }))

    await supabase.from('cards').insert(cardsToInsert)
    setCardCodes('')
    alert(`تم إضافة ${cardsToInsert.length} كارت بنجاح إلى المخزن!`)
  }

  // حفظ إعدادات بوابة شحناوي
  const handleSaveSettings = async (e) => {
    e.preventDefault()
    await supabase.from('settings').upsert({
      id: 1,
      public_key: publicKey,
      secret_key: secretKey,
      primary_ip: primaryIp,
      secondary_ip: secondaryIp
    })
    alert('تم حفظ إعدادات بوابة شحناوي والـ IPs بنجاح!')
  }

  return (
    <div className="p-6 max-w-4xl mx-auto space-y-8 dir-rtl text-right">
      <h1 className="text-3xl font-bold border-b pb-4">لوحة تحكم الأدمن</h1>

      {/* 1. إعدادات المفاتيح والـ IP لبوابة شحناوي */}
      <form onSubmit={handleSaveSettings} className="p-4 border rounded-lg bg-gray-50 space-y-4">
        <h2 className="text-xl font-semibold text-blue-800">إعدادات بوابة شحناوي (API & IPs)</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm mb-1 font-medium">المفتاح العام (Public Key):</label>
            <input type="text" value={publicKey} onChange={e => setPublicKey(e.target.value)} className="w-full p-2 border rounded" placeholder="Public Key" />
          </div>
          <div>
            <label className="block text-sm mb-1 font-medium">المفتاح السري (Secret Key):</label>
            <input type="text" value={secretKey} onChange={e => setSecretKey(e.target.value)} className="w-full p-2 border rounded" placeholder="Secret Key" />
          </div>
          <div>
            <label className="block text-sm mb-1 font-medium">الـ IP الأول (Primary IP):</label>
            <input type="text" value={primaryIp} onChange={e => setPrimaryIp(e.target.value)} className="w-full p-2 border rounded" placeholder="192.168.1.1" />
          </div>
          <div>
            <label className="block text-sm mb-1 font-medium">الـ IP الثاني (Secondary IP):</label>
            <input type="text" value={secondaryIp} onChange={e => setSecondaryIp(e.target.value)} className="w-full p-2 border rounded" placeholder="192.168.1.2" />
          </div>
        </div>
        <button type="submit" className="bg-blue-600 text-white px-6 py-2 rounded shadow hover:bg-blue-700">حفظ الإعدادات</button>
      </form>

      {/* 2. إضافة فئة جديدة */}
      <form onSubmit={handleAddCategory} className="p-4 border rounded-lg space-y-3">
        <h2 className="text-xl font-semibold text-green-800">إضافة فئة كروت جديدة</h2>
        <input type="text" placeholder="اسم الفئة (مثلاً: كارت 200)" value={name} onChange={e => setName(e.target.value)} className="w-full p-2 border rounded" required />
        <input type="number" placeholder="السعر (بالجنيه)" value={price} onChange={e => setPrice(e.target.value)} className="w-full p-2 border rounded" required />
        <button type="submit" className="bg-green-600 text-white px-6 py-2 rounded shadow hover:bg-green-700">إضافة الفئة</button>
      </form>

      {/* 3. شحن كروت للفئة */}
      <form onSubmit={handleAddCards} className="p-4 border rounded-lg space-y-3">
        <h2 className="text-xl font-semibold text-purple-800">إضافة أكواد الكروت لمخزن الفئة</h2>
        <select value={selectedCategory} onChange={e => setSelectedCategory(e.target.value)} className="w-full p-2 border rounded" required>
          <option value="">اختر الفئة...</option>
          {categories.map(cat => (
            <option key={cat.id} value={cat.id}>{cat.name} - ({cat.price} ج.م)</option>
          ))}
        </select>
        <textarea placeholder="أدخل الأكواد هنا (ضع كل كود كارت في سطر منفصل)" value={cardCodes} onChange={e => setCardCodes(e.target.value)} rows={5} className="w-full p-2 border rounded" required />
        <button type="submit" className="bg-purple-600 text-white px-6 py-2 rounded shadow hover:bg-purple-700">إضافة الكروت للمخزن</button>
      </form>
    </div>
  )
}
