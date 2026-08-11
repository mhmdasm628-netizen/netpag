'use client'
import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabaseClient'

export default function StorePage() {
  const [categories, setCategories] = useState([])
  const [myOrders, setMyOrders] = useState([])
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    loadStoreData()
  }, [])

  const loadStoreData = async () => {
    // 1. جلب الفئات التي تحتوي على كروت متاحة فقط
    const { data: availableCategories } = await supabase
      .from('categories')
      .select('*, cards!inner(id)')
      .eq('cards.is_sold', false)

    // تصفية الفئات المكررة
    const uniqueCategories = Array.from(new Set(availableCategories?.map(a => a.id)))
      .map(id => availableCategories.find(a => a.id === id))
    
    setCategories(uniqueCategories || [])

    // 2. جلب كروت المستخدم التي لم تنتهِ صلاحيتها (أقل من 3 أيام)
    const { data: { user } } = await supabase.auth.getUser()
    if (user) {
      const { data: userOrders } = await supabase
        .from('orders')
        .select('*')
        .eq('user_id', user.id)
        .gt('expires_at', new Date().toISOString())
        .order('created_at', { ascending: false })

      setMyOrders(userOrders || [])
    }
  }

  // بدء عملية الشراء بالربط مع شحناوي
  const handleBuy = async (category) => {
    setLoading(true)
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      alert('برجاء تسجيل الدخول أولاً للتمكن من الشراء!')
      setLoading(false)
      return
    }

    const walletNumber = prompt('أدخل رقم المحفظة (فودافون/أورنج/اتصالات كاش):')
    if (!walletNumber) {
      setLoading(false)
      return
    }

    // جلب مفاتيح شحناوي من الإعدادات
    const { data: settings } = await supabase.from('settings').select('*').single()

    if (!settings?.public_key) {
      alert('لم يتم ضبط مفاتيح بوابة شحناوي بعد من لوحة الأدمن!')
      setLoading(false)
      return
    }

    try {
      // إنشاء طلب الدفع في بوابة شحناوي
      const response = await fetch('https://e.sha7nawy.com/api/payment/create', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': settings.public_key
        },
        body: JSON.stringify({
          number: walletNumber,
          amount: category.price,
          method: walletNumber.startsWith('010') ? 'vf_cash' : walletNumber.startsWith('012') ? 'or_cash' : 'et_cash',
          client: user.id,
          details: category.id
        })
      })

      const resData = await response.json()

      if (resData.status) {
        alert(`تم تقديم الطلب بنجاح! ${resData.message}`)
      } else {
        alert(`حدث خطأ: ${resData.message}`)
      }
    } catch (err) {
      alert('فشل الاتصال ببوابة شحناوي!')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="p-6 max-w-4xl mx-auto space-y-8 dir-rtl text-right">
      <h1 className="text-3xl font-bold text-center text-blue-900">متجر كروت الواي فاي</h1>

      {/* قسم الفئات المتاحة */}
      <section>
        <h2 className="text-2xl font-bold mb-4 border-b pb-2">الفئات المتاحة للشراء</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {categories.length === 0 ? (
            <p className="text-gray-500">عفواً، لا توجد كروت متاحة حالياً.</p>
          ) : (
            categories.map(cat => (
              <div key={cat.id} className="border p-6 rounded-xl shadow-md bg-white hover:shadow-lg transition">
                <h3 className="text-2xl font-bold text-gray-800">{cat.name}</h3>
                <p className="text-green-600 font-extrabold text-2xl my-3">{cat.price} ج.م</p>
                <button 
                  disabled={loading}
                  onClick={() => handleBuy(cat)} 
                  className="w-full bg-blue-600 text-white font-bold py-2 rounded-lg hover:bg-blue-700 transition"
                >
                  {loading ? 'جاري الاتصال...' : 'شراء الآن'}
                </button>
              </div>
            ))
          )}
        </div>
      </section>

      {/* قسم كروت الزبون المشتراة */}
      <section className="bg-gray-50 p-6 rounded-xl border">
        <h2 className="text-2xl font-bold mb-4 text-purple-900">كروتي المشتراة (تختفي تلقائياً بعد 3 أيام)</h2>
        <div className="space-y-3">
          {myOrders.length === 0 ? (
            <p className="text-gray-500">لا توجد لديك كروت نشطة حالياً.</p>
          ) : (
            myOrders.map(order => (
              <div key={order.id} className="p-4 border bg-white rounded-lg flex justify-between items-center shadow-sm">
                <div>
                  <p className="text-sm text-gray-500 mb-1">كود الكارت:</p>
                  <span className="font-mono text-xl font-bold text-blue-800 tracking-wider">{order.card_code}</span>
                </div>
                <div className="text-left">
                  <span className="text-xs bg-green-100 text-green-800 px-3 py-1 rounded-full font-semibold">نشط</span>
                  <p className="text-xs text-gray-400 mt-1">تاريخ الشراء: {new Date(order.created_at).toLocaleDateString('ar-EG')}</p>
                </div>
              </div>
            ))
          )}
        </div>
      </section>
    </div>
  )
}
