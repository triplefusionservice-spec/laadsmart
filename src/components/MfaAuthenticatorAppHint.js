const GOOGLE_AUTH_IOS = 'https://apps.apple.com/app/google-authenticator/id388497605';
const GOOGLE_AUTH_ANDROID = 'https://play.google.com/store/apps/details?id=com.google.android.apps.authenticator2';
const MS_AUTH_IOS = 'https://apps.apple.com/app/microsoft-authenticator/id983156458';
const MS_AUTH_ANDROID = 'https://play.google.com/store/apps/details?id=com.azure.authenticator';

function storeUrlForDevice(iosUrl, androidUrl) {
  if (typeof navigator === 'undefined') return androidUrl;
  const ua = navigator.userAgent || '';
  if (/iPad|iPhone|iPod/i.test(ua)) return iosUrl;
  return androidUrl;
}

export function openGoogleAuthenticatorInstallPage() {
  window.open(storeUrlForDevice(GOOGLE_AUTH_IOS, GOOGLE_AUTH_ANDROID), '_blank', 'noopener,noreferrer');
}

export function openMicrosoftAuthenticatorInstallPage() {
  window.open(storeUrlForDevice(MS_AUTH_IOS, MS_AUTH_ANDROID), '_blank', 'noopener,noreferrer');
}

const nameStyle = {
  color: 'white',
  cursor: 'pointer',
  textDecoration: 'underline',
  textDecorationStyle: 'dotted',
  textUnderlineOffset: '2px',
};

/** Zin met Google / Microsoft Authenticator; dubbelklik op een naam opent de store-pagina. */
export function MfaAuthenticatorAppHint({ suffix }) {
  return (
    <>
      Open{' '}
      <strong
        role="button"
        tabIndex={0}
        style={nameStyle}
        title="Dubbelklik: Google Authenticator in de App Store of Play Store"
        onDoubleClick={(e) => {
          e.preventDefault();
          openGoogleAuthenticatorInstallPage();
        }}
        onKeyDown={(e) => {
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            openGoogleAuthenticatorInstallPage();
          }
        }}
      >
        Google Authenticator
      </strong>
      {' '}of{' '}
      <strong
        role="button"
        tabIndex={0}
        style={nameStyle}
        title="Dubbelklik: Microsoft Authenticator in de App Store of Play Store"
        onDoubleClick={(e) => {
          e.preventDefault();
          openMicrosoftAuthenticatorInstallPage();
        }}
        onKeyDown={(e) => {
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            openMicrosoftAuthenticatorInstallPage();
          }
        }}
      >
        Microsoft Authenticator
      </strong>
      {suffix}
      <span style={{ display: 'block', marginTop: '6px', fontSize: '11px', color: '#6db88a', fontWeight: '500' }}>
        Tip: dubbelklik op een van de twee namen hierboven om de downloadpagina te openen (App Store / Play Store).
      </span>
    </>
  );
}
