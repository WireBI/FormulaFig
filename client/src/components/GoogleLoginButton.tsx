'use client';

import { GoogleLogin } from '@react-oauth/google';
import { useState } from 'react';

export default function GoogleLoginButton({ onToken }: { onToken: (token: string) => void }) {
  return (
    <div className="flex items-center">
      <GoogleLogin
        onSuccess={(credentialResponse) => {
          if (credentialResponse.credential) {
            console.log('Login Success');
            onToken(credentialResponse.credential);
          }
        }}
        onError={() => {
          console.error('Login Failed');
        }}
        useOneTap
        theme="filled_black"
        shape="pill"
      />
    </div>
  );
}
