import { NextResponse } from 'next/server'
import supabase from '@/lib/supabaseClient'

export async function POST(req) {
  try {
    // 1. جلب IP الجهة المُرسلة
    const clientIp = req.headers.get('x-forwarded-for') || req.ip

    // 2. التحقق من الـ IPs المسموح بها والمحفوظة في قاعدة البيانات
    const { data: settings } = await supabase.from('settings').select('*').single()
    const allowedIps = [settings?.primary_ip, settings?.secondary_ip].filter(Boolean)

    if (allowedIps.length > 0 && !allowedIps.includes(clientIp)) {
      return NextResponse.json({ error: 'Unauthorized IP' }, { status: 403 })
    }

    // 3. استقبال بيانات عملية الدفع من شحناوي
    const body = await req.json()
    const { event, transaction } = body

    // التأكد من نجاح العملية
    if (transaction && transaction.status === 'completed') {
      const { client, details } = transaction // client يحتوي على ID المستخدم، و details توضح الفئة
      
      // تنفيذ دالة شراء الكارت وتسليمه للمستخدم
      const { data: cardCode, error } = await supabase.rpc('buy_card', {
        p_user_id: client,
        p_category_id: details
      })

      if (error) throw error

      return NextResponse.json({ status: true, message: 'Card delivered successfully', cardCode })
    }

    return NextResponse.json({ status: false, message: 'Transaction not completed' })
  } catch (err) {
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}
