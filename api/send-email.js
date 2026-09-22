export default async function handler(req,res){
 if(req.method!=='POST') return res.status(405).json({error:'Method not allowed'});
 try{
  const {to,subject,html}=req.body||{};
  if(!to||!subject||!html) return res.status(400).json({error:'to, subject and html are required'});
  if(!process.env.RESEND_API_KEY||!process.env.RESEND_FROM_EMAIL) return res.status(500).json({error:'Resend environment variables are not configured'});
  const response=await fetch('https://api.resend.com/emails',{method:'POST',headers:{'Authorization':`Bearer ${process.env.RESEND_API_KEY}`,'Content-Type':'application/json'},body:JSON.stringify({from:process.env.RESEND_FROM_EMAIL,to:[to],subject,html})});
  const data=await response.json();
  if(!response.ok) return res.status(response.status).json(data);
  return res.status(200).json(data);
 }catch(error){return res.status(500).json({error:error.message});}
}
